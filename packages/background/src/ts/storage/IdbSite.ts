/* eslint-disable no-await-in-loop */
/* eslint-disable class-methods-use-this */

import { IPluginDefinition, ISite, IPlugin } from 'get-set-fetch-extension-commons';
import BaseEntity from 'get-set-fetch/lib/storage/base/BaseEntity';
import BloomFilter from 'get-set-fetch/lib/filters/bloom/BloomFilter';
import deepmerge from '../helpers/DeepMergeHelper';
import IdbResource from './IdbResource';
import PluginManager from '../plugins/PluginManager';

import Logger from '../logger/Logger';

const Log = Logger.getLogger('IdbSite');

export default class IdbSite extends BaseEntity implements ISite {
  // IndexedDB can't do partial update, define all site properties to be stored
  get props() {
    return [ 'id', 'projectId', 'name', 'url', 'robotsTxt', 'pluginDefinitions', 'resourceFilter' ];
  }

  // get a read transaction
  static rTx() {
    return IdbSite.db.transaction('Sites').objectStore('Sites');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbSite.db.transaction('Sites', 'readwrite').objectStore('Sites');
  }

  static get(nameOrId: number|string): Promise<IdbSite> {
    return new Promise((resolve, reject) => {
      const rTx = IdbSite.rTx();
      const readReq = (Number.isInteger(nameOrId as number) ? rTx.get(nameOrId) : rTx.index('name').get(nameOrId));

      readReq.onsuccess = async (e: any) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          resolve(new IdbSite(result));
        }
      };
      readReq.onerror = () => reject(new Error(`could not read site: ${nameOrId}`));
    });
  }

  static getAll(projectId?: number): Promise<IdbSite[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbSite.rTx();
      const readReq = projectId ? rTx.index('projectId').getAll(projectId) : rTx.getAll();

      readReq.onsuccess = async (e: any) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          try {
            for (let i = 0; i < result.length; i += 1) {
              result[i] = new IdbSite(result[i]);
            }
            resolve(result);
          }
          catch (err) {
            reject(err);
          }
        }
      };
      readReq.onerror = () => reject(new Error('could not read sites'));
    });
  }

  static getAllIds(projectId?: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbSite.rTx();
      const readReq = projectId ? rTx.index('projectId').getAll(projectId) : rTx.getAll();

      readReq.onsuccess = async (e: any) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          const siteIds = result.map(row => row.id);
          resolve(siteIds);
        }
      };
      readReq.onerror = () => reject(new Error('could not read sites'));
    });
  }

  static delAll() {
    return new Promise(async (resolve, reject) => {
      try {
        const siteIds = await IdbSite.getAllIds();
        await IdbSite.delSome(siteIds);
        resolve();
      }
      catch (err) {
        reject(err);
      }
    });
  }

  static async delSome(siteIds: number[]) {
    return Promise.all(
      siteIds.map(async siteId => {
        const resourcesIds = await IdbResource.getAllIds(siteId);
        await IdbResource.delSome(resourcesIds);
        await IdbSite.delSingle(siteId);
      }),
    );
  }

  static delSingle(siteId) {
    return new Promise((resolve, reject) => {
      const rwTx = IdbSite.rwTx();
      const req = rwTx.delete(siteId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error(`could not delete site: ${siteId}`));
    });
  }

  id: number;
  projectId: number;
  name: string;
  url: string;
  tabId: any;

  pluginDefinitions: IPluginDefinition[];
  plugins: IPlugin[];

  storageOpts: {
    resourceFilter: {
      maxEntries: number;
      probability: number;
    };
  };

  resourcesNo: number;

  constructor(kwArgs: Partial<ISite> = {}) {
    super();

    Object.keys(kwArgs).forEach(kwArgKey => {
      this[kwArgKey] = kwArgs[kwArgKey];
    });

    if (!kwArgs.storageOpts) {
      this.storageOpts = {
        resourceFilter: {
          maxEntries: 5000,
          probability: 0.01,
        },
      };
    }

    // if no plugin definitions provided use the default ones
    this.pluginDefinitions = !kwArgs.pluginDefinitions ? PluginManager.getDefaultPluginDefs() : kwArgs.pluginDefinitions;

    // resources from the same site are always crawled in the same tab
    this.tabId = null;
  }

  getResourceToCrawl(frequency) {
    return IdbResource.getResourceToCrawl(this.id, frequency);
  }

  async crawl() {
    try {
      this.plugins = await PluginManager.instantiate(this.pluginDefinitions);
    }
    catch (err) {
      Log.error(
        `Error instantiating plugin definitions for site ${this.name}`,
        err,
      );
    }
    this.resourcesNo = (await IdbSite.getAllIds()).length;

    let resource;
    do {
      try {
        resource = await this.crawlResource();
      }
      catch (err) {
        // todo: if resource in status "crawling", reset it, or try another crawlResource a fixed number of times
      }
    }
    while (resource);
  }

  /*
  will execute the plugins in the order they are defined
  apply each plugin to the current (site, resource) pair
  1st plugin will always select the resource to be crawled
  a LazyLoading type plugin that succesfully scrolls new content, will force all prior plugins to be executed again

  examples:
    SelectResourcePlugin (only retrieves a resource if one is not already present)
    FetchPlugin
    ExtractUrlsPlugin
    ScrollPlugin (will trigger SelectResourcePlugin,FetchPlugin,ExtractUrlsPlugin till lazyloading condition is no longer met)
    UpdatePlugin
  */
  async crawlResource(inputResource: IdbResource = null, lazyLoading: boolean = false) {
    let resource: IdbResource;
    let pluginIdx: number;

    try {
      // 1st plugin is always selecting the resource to crawl
      resource = inputResource || await this.executePlugin(this.plugins[0], inputResource);

      // no crawlable resource found, exit
      if (!resource) {
        Log.info(`No crawlable resource found for site ${this.name}`);
        return null;
      }

      Log.info(`${resource.url} selected for crawling, lazyLoading: ${lazyLoading}`);

      // execute remaining plugins
      for (let pluginIdx = 1; pluginIdx < this.plugins.length; pluginIdx += 1) {
        const result = await this.executePlugin(this.plugins[pluginIdx], resource);

        // lazyloading enabled plugin encountered
        if (this.plugins[pluginIdx].opts && this.plugins[pluginIdx].opts.lazyLoading === true && this.plugins[pluginIdx].opts.enabled === true) {
          // new content was succesfully lazyloaded, re-execute the plugins encountered so far
          if (result === true) {
            await this.crawlResource(resource, true);
          }

          // only execute the plugins after the lazyLoad one on the initial crawlResource invocation
          if (lazyLoading) return null;
        }
        // regular plugin encountered returning a result that can be merged with the current resource
        else if (result) {
          /*
          don't deepmerge at resource level, IdbResource class functions like update are lost
          do an override or deep merge at each result key
          */
          Object.keys(result).forEach(key => {
            // non-null, primitive or blob, override coresponding resource key
            if (result[key] !== Object(result[key] || result[key] instanceof Blob)) {
              resource[key] = result[key];
            }
            // plain object, merge with corresponding resource key
            else {
              resource[key] = deepmerge(resource[key], result[key]);
            }
          });
        }
      }
    }
    catch (err) {
      console.log(err);
      Log.error(
        `Crawl error for site ${this.name}, Plugin ${this.plugins[pluginIdx].constructor.name} against resource ${resource ? resource.url : ''}`,
        err,
      );

      /*
        manually update the resource, this resets the crawlInProgress flag and adds crawledAt date
        selecting new resources for crawling takes crawledAt in consideration (right now only resources with crawledAt undefined qualify)
        because of the above behavior, we don't attempt to crawl a resource that throws an error over and over again

        in future a possible approach will be just resetting the crawlInProgress flag
          - next crawl operation will attempt to crawl it again, but atm this will just retry the same resource over and over again
          - there is no mechanism to escape the retry loop
        resource.crawlInProgress = false;
        await resource.update(false);
      */
      if (resource) {
        // eslint-disable-next-line no-await-in-loop
        await resource.update();
      }

      throw err;
    }

    Log.debug(`Resource successfully crawled (json): ${JSON.stringify(resource)}`);
    Log.info(`Resource successfully crawled (url): ${resource.url}`);

    return resource;
  }

  async executePlugin(plugin: IPlugin, resource: IdbResource) {
    Log.info(
      `Executing plugin ${plugin.constructor.name} using options ${JSON.stringify(plugin.opts)} against resource ${JSON.stringify(resource)}`,
    );

    if (plugin.opts && plugin.opts.runInTab) {
      return PluginManager.runInTab(this.tabId, plugin, this, resource);
    }

    // test if plugin is aplicable
    const isApplicable = await plugin.test(resource);

    if (isApplicable) {
      return plugin.apply(this, resource);
    }

    return null;
  }

  save(): Promise<number> {
    return new Promise(async (resolve, reject) => {
      const rwTx = IdbSite.rwTx();
      // save the site and wait for the return result containing the new inserted id
      const reqAddSite = rwTx.add(this.serializeWithoutId());
      reqAddSite.onsuccess = async (e: any) => {
        this.id = e.target.result;

        // also save the site url as the first site resource at depth 0
        try {
          await this.saveResources([ this.url ], 0);
          resolve(this.id);
        }
        catch (err) {
          reject(err);
        }
      };

      reqAddSite.onerror = err => {
        reject(new Error(`could not add site: ${this.url} - ${err}`));
      };
    });
  }

  saveResources(urls, depth) {
    return new Promise((resolve, reject) => {
      // need a transaction across multiple stores
      const tx = IdbSite.db.transaction([ 'Sites', 'Resources' ], 'readwrite');

      // read the latest resource filter bitset
      const reqReadSite = tx.objectStore('Sites').get(this.id);
      reqReadSite.onsuccess = (e: any) => {
        const latestSite = e.target.result;
        const { maxEntries, probability } = this.storageOpts.resourceFilter;
        const bloomFilter = BloomFilter.create(maxEntries, probability, latestSite.resourceFilter);

        // create new resources
        const resources = [];
        urls.forEach(url => {
          if (bloomFilter.test(url) === false) {
            resources.push(new IdbResource({ siteId: this.id, url, depth }).serializeWithoutId());
            bloomFilter.add(url);
          }
        });

        // if present, save filtered resources
        if (resources.length > 0) {
          const successHandler = () => {
            // keep saving new resources
            if (resources.length > 0) {
              const resource = resources.pop();
              Log.info(`saving resource: ${resource.url}`);
              const reqAddResource = tx.objectStore('Resources').add(resource);
              reqAddResource.onsuccess = successHandler;
              reqAddResource.onerror = () => reject(new Error(`could not add resource: ${resource.url}`));
            }
            // update bloomFilter, can only be done updating the entire site
            else {
              latestSite.resourceFilter = bloomFilter.bitset;
              const reqUpdateSite = tx.objectStore('Sites').put(latestSite);
              reqUpdateSite.onsuccess = () => resolve();
              reqUpdateSite.onerror = () => reject(new Error(`could not update site: ${this.url}`));
            }
          };

          successHandler();
        }
        // otherwise nothing to do
        else {
          resolve();
        }
      };

      reqReadSite.onerror = () => reject(new Error(`could not read site: ${this.url}`));
    });
  }

  update() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbSite.rwTx();
      const reqUpdateSite = rwTx.put(this.serialize());
      reqUpdateSite.onsuccess = () => resolve();
      reqUpdateSite.onerror = () => reject(new Error(`could not update site: ${this.url}`));
    });
  }

  del() {
    return new Promise(async (resolve, reject) => {
      try {
        // delete linked resources
        const resourceIds = await IdbResource.getAllIds(this.id);
        await IdbResource.delSome(resourceIds);

        // delete site
        await IdbSite.delSingle(this.id);
        resolve();
      }
      catch (error) {
        reject(error);
      }
    });
  }

  serialize(): any {
    const serializedObj = this.props.reduce((acc, key) => Object.assign(acc, { [key]: this[key] }), {});
    return serializedObj;
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}
