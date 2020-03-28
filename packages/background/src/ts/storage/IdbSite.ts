/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
/* eslint-disable class-methods-use-this */

import { IPluginDefinition, ISite, BasePlugin, IResource } from 'get-set-fetch-extension-commons';
import BaseEntity from 'get-set-fetch/lib/storage/base/BaseEntity';
import BloomFilter from 'get-set-fetch/lib/filters/bloom/BloomFilter';
import deepmerge from '../helpers/DeepMergeHelper';
import IdbResource from './IdbResource';
import Logger from '../logger/Logger';
import ModuleStorageManager from '../plugins/ModuleStorageManager';
import ModuleRuntimeManager from '../plugins/ModuleRuntimeManager';

const Log = Logger.getLogger('IdbSite');

export default class IdbSite extends BaseEntity implements ISite {
  // IndexedDB can't do partial update, define all site properties to be stored
  get props() {
    return [ 'id', 'projectId', 'name', 'url', 'robotsTxt', 'plugins', 'resourceFilter' ];
  }

  // get a read transaction
  static rTx() {
    return IdbSite.db.transaction('Sites').objectStore('Sites');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbSite.db.transaction('Sites', 'readwrite').objectStore('Sites');
  }

  static get(nameOrId: number | string): Promise<IdbSite> {
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

  plugins: IPluginDefinition[];
  pluginInstances: BasePlugin[];

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
    this.plugins = !kwArgs.plugins ? ModuleStorageManager.getDefaultPluginDefs() : kwArgs.plugins;

    // resources from the same site are always crawled in the same tab
    this.tabId = null;
  }

  getResourceToCrawl(frequency: number) {
    return IdbResource.getResourceToCrawl(this.id, frequency);
  }

  async crawl() {
    try {
      this.pluginInstances = await ModuleRuntimeManager.instantiatePlugins(this.plugins);
    }
    catch (err) {
      Log.error(
        `Error instantiating plugin definitions for site ${this.name}`,
        err,
      );
    }
    this.resourcesNo = (await IdbSite.getAllIds()).length;

    const domPluginsPresent = this.pluginInstances.some(
      pluginInstance => pluginInstance.opts.domManipulation && (pluginInstance.opts.enabled === undefined || pluginInstance.opts.enabled === true),
    );

    let staticResource = null;
    let dynamicResource = null;
    do {
      /*
      a null resource will result in selection of a new resource from the db (ex: SelectResourcePlugin)
      an existing resource can result in a new resource being generated in case of dynamic actions (ex: ScrollPlugin, ClickPlugin)

      after applying all the plugins, if the returned resource is null:
        - there are no resources to crawl from the db
        - there are no more dynamic actions to take
      => if both conditions are met, crawl is stopped
      */

      // retrieve static resource, opening its url in a new browser tab
      staticResource = await this.crawlResource();

      if (staticResource && domPluginsPresent) {
        do {
          // retrieve dynamic resource, use the current tab dom state to further scroll, click, etc..
          dynamicResource = await this.crawlResource(staticResource);
        }
        while (dynamicResource);
      }
    }
    while (staticResource);
  }

  async crawlResource(resource: IdbResource = null) {
    let pluginIdx: number;
    let resourceFound = false;

    try {
      /*
      will execute the plugins in the order they are defined
      apply each plugin to the current (site, resource) pair
      */
      for (pluginIdx = 0; pluginIdx < this.pluginInstances.length; pluginIdx += 1) {
        const result = await this.executePlugin(this.pluginInstances[pluginIdx], resource);
        /*
        a plugin result can represent:
        - a new static resource
          - IdbResource from the db not yet crawled (ex: SelectResourcePlugin)
        - a new dynamic resource (ex: ScrollPlugin, ClickPlugin)
          - obj containing an "actions" key
        - additional data/content to be merged with the current resource (ex: ExtractUrlsPlugin, ExtractHtmlContentPlugin, ...)
          - generic object
        */

        // a new static resource has been generated
        if (result instanceof IdbResource) {
          resource = result;
          resourceFound = true;
        }
        // a new dynamic resource has been generated, it will be crawled right away by the next plugins
        else if (result && Object.prototype.hasOwnProperty.call(result, 'actions')) {
          resource = new IdbResource(
            Object.assign(
              result,
              {
                siteId: resource.siteId,
                url: resource.url,
                mediaType: resource.mediaType,
                depth: resource.depth,
                crawlInProgress: true,
              },
            ),
          );
          resourceFound = true;
        }
        // new content has been generated to be merged wih the current resource
        else {
          this.mergeResourceResult(resource, result);
        }
      }
    }
    catch (err) {
      Log.error(
        // eslint-disable-next-line max-len
        `Crawl error for site ${this.name}, Plugin ${this.pluginInstances[pluginIdx].constructor.name} against resource ${resource ? resource.url : ''}`,
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

    if (resource) {
      Log.debug(`Resource successfully crawled (json): ${JSON.stringify(resource)}`);
      Log.info(`Resource successfully crawled (url): ${resource.url}`);
    }
    else {
      Log.info(`No crawlable resource found for site ${this.name}`);
    }

    return resourceFound ? resource : null;
  }

  async executePlugin(plugin: BasePlugin, resource: IdbResource) {
    Log.info(
      `Executing plugin ${plugin.constructor.name} using options ${JSON.stringify(plugin.opts)} against resource ${JSON.stringify(resource)}`,
    );

    if (plugin.opts && plugin.opts.runInTab) {
      return ModuleRuntimeManager.runInTab(this.tabId, plugin, this, resource);
    }

    // test if plugin is aplicable
    const isApplicable = await plugin.test(this, resource);
    if (isApplicable) {
      return plugin.apply(this, resource);
    }

    return null;
  }

  mergeResourceResult(resource: IResource, result: any) {
    // if no result is returned from plugin, nothing to merge
    if (!result) return;

    /*
    don't deepmerge at resource level, IdbResource class functions like update are lost
    do an override or deep merge at each result key
    */
    Object.keys(result || {}).forEach(key => {
      // non-null, primitive or blob, override coresponding resource key
      if (result[key] !== Object(result[key]) || result[key] instanceof Blob) {
        // eslint-disable-next-line no-param-reassign
        resource[key] = result[key];
      }
      // plain object, merge with corresponding resource key
      else {
        // eslint-disable-next-line no-param-reassign
        resource[key] = deepmerge(resource[key], result[key]);
      }
    });
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
