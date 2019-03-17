import { BaseResource } from 'get-set-fetch';
import { IResource } from 'get-set-fetch-extension-commons';

/* eslint-disable class-methods-use-this */
export default class IdbResource extends BaseResource {
  // get a read transaction
  static rTx() {
    return IdbResource.db.transaction('Resources').objectStore('Resources');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbResource.db.transaction('Resources', 'readwrite').objectStore('Resources');
  }

  static parseResult(result) {
    return {
      crawlInProgress: result.crawlInProgress === 1
    };
  }

  static get(urlOrId): Promise<IdbResource> {
    return new Promise((resolve, reject) => {
      const rTx = IdbResource.rTx();
      const readReq = (Number.isInteger(urlOrId) ? rTx.get(urlOrId) : rTx.index('url').get(urlOrId));

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          Object.assign(result, this.parseResult(result));
          resolve(new IdbResource(result));
        }
      };
      readReq.onerror = () => {
        reject(new Error(`could not read resource: ${urlOrId}`));
      };
    });
  }

  static getAllCrawled(siteId: number) {
    const idbKey = IDBKeyRange.bound(
      [siteId, 0, new Date(1)],
      [siteId, 0, new Date(Date.now())]
    );

    return this.getAll(siteId, idbKey);
  }

  static getAllNotCrawled(siteId: number) {
    const idbKey = IDBKeyRange.only([siteId, 0, new Date(0)]);
    return this.getAll(siteId, idbKey);
  }

  static getAll(siteId: number, idbKey = null, instantiate: boolean = true): Promise<IdbResource[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbResource.rTx();
      const readReq = idbKey ? rTx.index('getResourceToCrawl').getAll(idbKey) : rTx.index('siteId').getAll(siteId);

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          if (instantiate) {
            for (let i = 0; i < result.length; i += 1) {
              Object.assign(result[i], this.parseResult(result[i]));
              result[i] = new IdbResource(result[i]);
            }
          }
          resolve(result);
        }
      };
      readReq.onerror = () => reject(new Error(`could not read site: ${siteId}`));
    });
  }

  static getAllIds(siteId: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbResource.rTx();
      const readReq = rTx.index('siteId').getAll(siteId);

      readReq.onsuccess = async (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          const resourceIds = result.map(row => row.id);
          resolve(resourceIds);
        }
      };
      readReq.onerror = () => reject(new Error('could not read resources'));
    });
  }

  // within a transaction find a resource to crawl and set its crawlInProgress flag
  static getResourceToCrawlWithKey(idbKey) {
    return new Promise((resolve, reject) => {
      const rwTx = IdbResource.rwTx();
      const getReq = rwTx.index('getResourceToCrawl').get(idbKey);

      getReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          const resource = new IdbResource(result);
          resource.crawlInProgress = true;
          const reqUpdateResource = rwTx.put(resource.serialize());
          reqUpdateResource.onsuccess = () => resolve(resource);
          reqUpdateResource.onerror = () => reject(new Error(`could not update crawlInProgress for resource: ${resource.url}`));
        }
      };
      getReq.onerror = (err) => {
        reject(new Error('could not read resource to crawl: ' + err.message));
      };
    });
  }

  static async getResourceToCrawl(siteId, crawlFrequency) {
    // try to find a resource matching {siteId, crawlInProgress : false, crawledAt: null}
    let resource = await this.getResourceToCrawlWithKey(IDBKeyRange.only([siteId, 0, new Date(0)]));

    // try to find a resource matching {siteId, crawlInProgress : false, crawledAt: older than crawlFrequency}
    if (!resource && crawlFrequency >= 0) {
      resource = await this.getResourceToCrawlWithKey(IDBKeyRange.bound(
        [siteId, 0, new Date(0)],
        [siteId, 0, new Date(Date.now() - (crawlFrequency * 60 * 60 * 1000))]
      ));
    }

    return resource;
  }

  static delAll() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbResource.rwTx();
      const req = rwTx.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('could not clear Resources'));
    });
  }

  static delSome(ids, resolve = null, reject = null) {
    if (resolve && reject) {
      const rwTx = IdbResource.rwTx();
      const req = rwTx.delete(ids.pop());
      req.onsuccess = () => {
        if (ids.length === 0) {
          resolve();
        }
        else this.delSome(ids, resolve, reject);
      };
      req.onerror = () => reject(new Error('could not delsome Resources'));
      return null;
    }

    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      if (ids && ids.length > 0) {
        this.delSome(ids, resolve, reject);
      }
      else {
        resolve();
      }
    });
  }

  id: number;
  url: string;
  siteId: number;
  crawledAt: any;
  crawlInProgress: boolean;
  depth: number;
  info: any;
  blob: any;
  mediaType: string;

  constructor(kwArgs: Partial<IResource> = {}) {
    super(kwArgs.siteId, kwArgs.url, kwArgs.depth);
    for (const key in kwArgs) {
      this[key] = kwArgs[key];
    }
    this.crawledAt = kwArgs.crawledAt ? kwArgs.crawledAt : new Date(0);
  }

  save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const rwTx = IdbResource.rwTx();
      const reqAddResource = rwTx.add(this.serializeWithoutId());
      reqAddResource.onsuccess = (e) => {
        this.id = e.target.result;
        resolve(this.id);
      };
      reqAddResource.onerror = () => reject(new Error(`could not add resource: ${this.url}`));
    });
  }

  update() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbResource.rwTx();
      this.crawledAt = new Date();
      this.crawlInProgress = false;
      const reqUpdateResource = rwTx.put(this.serialize());
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not update resource: ${this.url}`));
    });
  }

  del() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbResource.rwTx();
      const reqUpdateResource = rwTx.delete(this.id);
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not delete resource: ${this.url}`));
    });
  }

  // IndexedDB can't do partial update, define all resource properties to be stored
  get props() {
    return ['id', 'siteId', 'url', 'depth', 'info', 'crawledAt', 'crawlInProgress', 'blob', 'mediaType'];
  }

  serialize(): any {
    const serialized: any = this.props.reduce((acc, key) => Object.assign(acc, { [key]: this[key] }), {});
    // crawlInProgress is an IndexedDB index with boolean values not supported
    serialized.crawlInProgress = serialized.crawlInProgress ? 1 : 0;
    return serialized;
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}
