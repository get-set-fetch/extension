import BaseResource from 'get-set-fetch/lib/storage/base/BaseResource';
import { IResource } from 'get-set-fetch-extension-commons';
import { IResourceParent } from 'get-set-fetch-extension-commons/lib/resource';
import Logger from '../logger/Logger';

/* eslint-disable class-methods-use-this */

const Log = Logger.getLogger('IdbResource');
export default class IdbResource extends BaseResource implements IResource {
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
      crawlInProgress: result.crawlInProgress === 1,
    };
  }

  static get(urlOrId): Promise<IdbResource> {
    return new Promise((resolve, reject) => {
      const rTx = IdbResource.rTx();
      const readReq = (Number.isInteger(urlOrId) ? rTx.get(urlOrId) : rTx.index('url').get(urlOrId));

      readReq.onsuccess = e => {
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
      [ siteId, 0, new Date(1) ],
      [ siteId, 0, new Date(Date.now()) ],
    );

    return this.getAll(siteId, idbKey);
  }

  static getAll(siteId: number, idbKey = null, instantiate: boolean = true): Promise<IdbResource[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbResource.rTx();
      const readReq = idbKey ? rTx.index('getResourceToCrawl').getAll(idbKey) : rTx.index('siteId').getAll(siteId);

      readReq.onsuccess = e => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          try {
            if (instantiate) {
              for (let i = 0; i < result.length; i += 1) {
                Object.assign(result[i], this.parseResult(result[i]));
                result[i] = new IdbResource(result[i]);
              }
            }
            resolve(result);
          }
          catch (err) {
            reject(err);
          }
        }
      };
      readReq.onerror = () => reject(new Error(`could not read site: ${siteId}`));
    });
  }

  static getAllIds(siteId: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbResource.rTx();
      const readReq = rTx.index('siteId').getAll(siteId);

      readReq.onsuccess = async e => {
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
  static getResourceToCrawlWithKey(idbKey): Promise<IdbResource> {
    return new Promise((resolve, reject) => {
      const rwTx = IdbResource.rwTx();
      const getReq = rwTx.index('getResourceToCrawl').get(idbKey);

      getReq.onsuccess = e => {
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
      getReq.onerror = err => {
        reject(new Error(`could not read resource to crawl: ${err.message}`));
      };
    });
  }

  static async getResourceToCrawl(siteId, frequency: number): Promise<IdbResource> {
    // try to find a resource matching {siteId, crawlInProgress : false, crawledAt: null}
    let resource = await this.getResourceToCrawlWithKey(IDBKeyRange.only([ siteId, 0, new Date(0) ]));

    // try to find a resource matching {siteId, crawlInProgress : false, crawledAt: older than frequency}
    if (!resource && frequency >= 0) {
      resource = await this.getResourceToCrawlWithKey(IDBKeyRange.bound(
        [ siteId, 0, new Date(0) ],
        [ siteId, 0, new Date(Date.now() - (frequency * 60 * 60 * 1000)) ],
      ));
    }

    return resource;
  }

  static saveMultiple(resources: Partial<IResource>[], resolve = null, reject = null) {
    if (resolve && reject) {
      const rwTx = IdbResource.rwTx();
      const resource = new IdbResource(resources.pop()).serializeWithoutId();
      const req = rwTx.add(resource);
      req.onsuccess = () => {
        if (resources.length === 0) {
          resolve();
        }
        else this.saveMultiple(resources, resolve, reject);
      };
      req.onerror = () => reject(new Error('could not saveMultiple Resources'));
      return null;
    }

    // eslint-disable-next-line no-shadow
    return new Promise((resolve, reject) => {
      if (resources && resources.length > 0) {
        this.saveMultiple(resources, resolve, reject);
      }
      else {
        resolve();
      }
    });
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

  id: number;
  url: string;
  actions: string[];
  siteId: number;
  crawledAt: any;
  crawlInProgress: boolean;
  depth: number;
  meta: any = {};
  content: any = {}
  blob: any;
  mediaType: string;
  parent: IResourceParent;
  resourcesToAdd: Partial<IResource>[];

  constructor(kwArgs: Partial<IResource> = {}) {
    super(kwArgs.siteId, kwArgs.url, kwArgs.depth);

    Object.keys(kwArgs).forEach(kwArgKey => {
      this[kwArgKey] = kwArgs[kwArgKey];
    });

    this.actions = kwArgs.actions ? kwArgs.actions : [];

    if (kwArgs.crawledAt) {
      this.crawledAt = kwArgs.crawledAt instanceof Date ? kwArgs.crawledAt : new Date(kwArgs.crawledAt);
    }
    else {
      this.crawledAt = new Date(0);
    }

    if (!kwArgs.blob) {
      this.blob = null;
    }

    if (!kwArgs.mediaType) {
      this.mediaType = null;
    }

    if (!kwArgs.parent) {
      this.parent = null;
    }

    // props comming from parent not used anymore, don't store them in db
    delete (this as any).urlsToAdd;
    delete (this as any).contentType;
    delete (this as any).info;
  }

  save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const rwTx = IdbResource.rwTx();
      const reqAddResource = rwTx.add(this.serializeWithoutId());
      reqAddResource.onsuccess = e => {
        this.id = e.target.result;
        resolve(this.id);
      };
      reqAddResource.onerror = () => reject(new Error(`could not add resource: ${this.url}`));
    });
  }

  update(includeCrawledAt: boolean = true) {
    return new Promise((resolve, reject) => {
      const rwTx = IdbResource.rwTx();
      if (includeCrawledAt) {
        this.crawledAt = new Date();
      }
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
    return [ 'id', 'siteId', 'url', 'actions', 'depth', 'content', 'meta', 'crawledAt', 'crawlInProgress', 'blob', 'mediaType', 'parent' ];
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
