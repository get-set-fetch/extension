import { BaseSite, BloomFilter } from 'get-set-fetch';
import IdbResource from './IdbResource';
import ExtensionPluginManager from '../plugins/ExtensionPluginManager';
import ExtensionExtractUrlPlugin from '../plugins/process/ExtensionExtractUrlPlugin';


/* eslint-disable class-methods-use-this */
class IdbSite extends BaseSite {
  // get a read transaction
  static rTx() {
    return IdbSite.db.transaction('Sites').objectStore('Sites');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbSite.db.transaction('Sites', 'readwrite').objectStore('Sites');
  }

  static async parseResult(result) {
    const plugins = ExtensionPluginManager.instantiate(JSON.parse(result.plugins));
    const userPlugins = result.opts.userPlugins ? (await ExtensionPluginManager.instantiateUserPlugins(result.opts.userPlugins)) : [];
    return { plugins: ExtensionPluginManager.orderPlugins(plugins.concat(userPlugins)) };
  }

  static get(nameOrId) {
    return new Promise((resolve, reject) => {
      const rTx = IdbSite.rTx();
      const readReq = (Number.isInteger(nameOrId) ? rTx.get(nameOrId) : rTx.index('name').get(nameOrId));

      readReq.onsuccess = async (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          Object.assign(result, (await this.parseResult(result)));
          resolve(Object.assign(new IdbSite(null, null, null, false), result));
        }
      };
      readReq.onerror = () => reject(new Error(`could not read site: ${nameOrId}`));
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      const rTx = IdbSite.rTx();
      const readReq = rTx.getAll();

      readReq.onsuccess = async (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          for (let i = 0; i < result.length; i += 1) {
            Object.assign(result[i], (await this.parseResult(result[i])));
            result[i] = Object.assign(new IdbSite(null, null, null, false), result[i]);
          }
          resolve(result);
        }
      };
      readReq.onerror = () => reject(new Error('could not read sites'));
    });
  }

  static delAll() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbSite.rwTx();
      const req = rwTx.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('could not clear Sites'));
    });
  }

  static delSome(ids, resolve = null, reject = null) {
    if (resolve && reject) {
      const rwTx = IdbSite.rwTx();
      const req = rwTx.delete(ids.pop());
      req.onsuccess = () => {
        if (ids.length === 0) {
          resolve();
        }
        else this.delSome(ids, resolve, reject);
      };
      req.onerror = () => reject(new Error('could not delSome Sites'));
      return null;
    }

    // eslint-disable-next-line no-shadow
    return new Promise((resolve, reject) => {
      if (ids && ids.length > 0) {
        this.delSome(ids, resolve, reject);
      }
      else {
        resolve();
      }
    });
  }

  constructor(name, url, opts, createDefaultPlugins = true) {
    super(name, url, opts, createDefaultPlugins);
    if (createDefaultPlugins) {
      this.plugins = ExtensionPluginManager.DEFAULT_PLUGINS;
    }

    // resources from the same site are always crawled in the same tab
    this.tabId = null;
  }

  addMaxDepthPlugin(maxDepth) {
    this.addPlugins([new ExtensionExtractUrlPlugin({ maxDepth })]);
  }

  getResourceToCrawl(crawlFrequency) {
    return IdbResource.getResourceToCrawl(this.id, crawlFrequency);
  }

  save() {
    // eslint-disable-next-line no-unused-vars
    return new Promise(async (resolve, reject) => {
      const rwTx = IdbSite.rwTx();
      // save the site and wait for the return result containing the new inserted id
      const reqAddSite = rwTx.add(this.serializeWithoutId());
      reqAddSite.onsuccess = async (e) => {
        this.id = e.target.result;

        // also save the site url as the first site resource at depth 0
        try {
          await this.saveResources([this.url], 0);
          resolve(this.id);
        }
        catch (err) {
          reject(err);
        }
      };

      reqAddSite.onerror = (err) => {
        reject(new Error(`could not add site: ${this.url} - ${err}`));
      };
    });
  }

  saveResources(urls, depth) {
    return new Promise((resolve, reject) => {
      // need a transaction across multiple stores
      const tx = IdbSite.db.transaction(['Sites', 'Resources'], 'readwrite');

      // read the latest resource filter bitset
      const reqReadSite = tx.objectStore('Sites').get(this.id);
      reqReadSite.onsuccess = (e) => {
        const latestSite = e.target.result;
        const { maxEntries, probability } = this.opts.resourceFilter;
        const bloomFilter = BloomFilter.create(maxEntries, probability, latestSite.resourceFilter);

        // create new resources
        const resources = [];
        urls.forEach((url) => {
          if (bloomFilter.test(url) === false) {
            resources.push(new IdbResource(this.id, url, depth).serializeWithoutId());
            bloomFilter.add(url);
          }
        });

        // if present, save filtered resources
        if (resources.length > 0) {
          const successHandler = () => {
            // keep saving new resources
            if (resources.length > 0) {
              const resource = resources.pop();
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
    return new Promise((resolve, reject) => {
      const rwTx = IdbSite.rwTx();
      const req = rwTx.delete(this.id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error(`could not delete site: ${this.url}`));
    });
  }


  // IndexedDB can't do partial update, define all site properties to be stored
  get props() {
    return ['id', 'name', 'url', 'opts', 'robotsTxt', 'plugins', 'resourceFilter'];
  }

  serialize() {
    const serializedObj = this.props.reduce((acc, key) => Object.assign(acc, { [key]: this[key] }), {});
    serializedObj.plugins = JSON.stringify(serializedObj.plugins);
    return serializedObj;
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}

module.exports = IdbSite;
