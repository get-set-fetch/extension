import { BaseSite, BloomFilter, PluginManager } from 'get-set-fetch';
import IdbResource from './IdbResource';

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

  static parseResult(result) {
    return {
      plugins: PluginManager.instantiate(JSON.parse(result.plugins)),
    };
  }

  static get(nameOrId) {
    return new Promise((resolve, reject) => {
      const rTx = IdbSite.rTx();
      const readReq = (Number.isInteger(nameOrId) ? rTx.get(nameOrId) : rTx.index('name').get(nameOrId));

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          Object.assign(result, this.parseResult(result));
          resolve(Object.assign(new IdbSite(null, null, null, false), result));
        }
      };
      readReq.onerror = () => reject(new Error(`could not read site: ${nameOrId}`));
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
              const reqUpdateSite = tx.objectStore('Sites').put(latestSite);
              reqUpdateSite.onsuccess = () => resolve();
              reqUpdateSite.onerror = () => reject(new Error(`could not update site: ${this.url}`));
            }
          };

          successHandler();
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
    return ['id', 'name', 'url', 'opts', 'robotsTxt', 'plugins'];
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
