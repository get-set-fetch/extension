import { IPluginDefinition, ISite } from 'get-set-fetch-extension-commons';
import { BaseEntity, BloomFilter } from 'get-set-fetch';
import IdbResource from './IdbResource';
import PluginManager from '../plugins/PluginManager';

import Logger from '../logger/Logger';

const Log = Logger.getLogger('IdbSite');

/* eslint-disable class-methods-use-this */
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

      readReq.onsuccess = async e => {
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

      readReq.onsuccess = async e => {
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

      readReq.onsuccess = async e => {
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
  plugins: any;

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
        // eslint-disable-next-line no-await-in-loop
        resource = await this.crawlResource();
      }
      catch (err) {
        // todo: if resource in status "crawling", reset it, or try another crawlResource a fixed number of times
      }
    }
    while (resource);
  }

  /**
   * loop through ordered (based on phase) plugins and apply each one to the current (site, resource) pair
   */
  crawlResource() {
    return new Promise(async (resolve, reject) => {
      let resource: IdbResource = null;
      for (let i = 0; i < this.plugins.length; i += 1) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const result = await this.executePlugin(this.plugins[i], resource);

          if (resource === null) {
            resource = result;
          }
          else {
            // plugin apply returns an info object, shallow merge it in order to avoid implementing a deep merge at resource level
            const info = Object.assign({}, resource.info, result ? result.info : null);
            resource = Object.assign(resource, result, { info });
          }

          // no resource present
          if (resource === null) {
            Log.info(`No crawlable resource found for site ${this.name}`);
            resolve(null);
            break;
          }

          if (i === 0) {
            Log.info(`${resource.url} selected for crawling`);
          }
          /*
          else {
            Log.info(`Result after applying ${this.plugins[i].name}: ${JSON.stringify(result)}`);
          }
          */
        }
        catch (err) {
          console.log(err);
          Log.error(
            `Crawl error for site ${this.name}, Plugin ${this.plugins[i].constructor.name} against resource ${resource ? resource.url : ''}`,
            err,
          );

          // reset the crawlInProgress flag, next crawl operation will attempt to crawl it again
          if (resource) {
            resource.crawlInProgress = false;
            // eslint-disable-next-line no-await-in-loop
            await resource.update(false);
          }

          reject(err);
          break;
        }
      }

      if (resource) {
        Log.debug(`Resource successfully crawled (json): ${JSON.stringify(resource)}`);
        Log.info(`Resource successfully crawled (url): ${resource.url}`);
      }
      resolve(resource);
    });
  }

  async executePlugin(plugin, resource) {
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
      reqAddSite.onsuccess = async e => {
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
      reqReadSite.onsuccess = e => {
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
