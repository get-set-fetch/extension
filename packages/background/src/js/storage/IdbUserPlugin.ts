import { BaseEntity } from 'get-set-fetch';

/* eslint-disable class-methods-use-this */

interface IPlugin {
  name: string;
  id: any;
  code: string;
}

export default class IdbUserPlugin extends BaseEntity {

  // IndexedDB can't do partial update, define all resource properties to be stored
  get props() {
    return ['id', 'name', 'code'];
  }

  static modules: Map<string,string> = new Map<string, string>();

  // get a read transaction
  static rTx() {
    return IdbUserPlugin.db.transaction('UserPlugins').objectStore('UserPlugins');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbUserPlugin.db.transaction('UserPlugins', 'readwrite').objectStore('UserPlugins');
  }

  static get(nameOrId: string|number): Promise<IdbUserPlugin> {
    return new Promise((resolve, reject) => {
      const rTx = IdbUserPlugin.rTx();
      const readReq = (Number.isInteger(nameOrId as number) ? rTx.get(nameOrId) : rTx.index('name').get(nameOrId));

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          resolve(new IdbUserPlugin(result));
        }
      };
      readReq.onerror = () => {
        reject(new Error(`could not read resource: ${nameOrId}`));
      };
    });
  }

  static getAll(): Promise<IdbUserPlugin[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbUserPlugin.rTx();
      const readReq = rTx.getAll();

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          for (let i = 0; i < result.length; i += 1) {
            result[i] = new IdbUserPlugin(result[i]);
          }
          resolve(result);
        }
      };
      readReq.onerror = () => reject(new Error('could not read UserPlugins'));
    });
  }

  static delAll() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbUserPlugin.rwTx();
      const req = rwTx.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('could not clear UserPlugins'));
    });
  }

  static delSome(ids, resolve = null, reject = null) {
    if (resolve && reject) {
      const rwTx = IdbUserPlugin.rwTx();
      const req = rwTx.delete(ids.pop());
      req.onsuccess = () => {
        if (ids.length === 0) {
          resolve();
        }
        else this.delSome(ids, resolve, reject);
      };
      req.onerror = () => reject(new Error('could not delSome UserPlugins'));
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

  id: any;
  name: string;
  code: string;

  constructor(kwArgs: Partial<IPlugin> = {}) {
    super();
    for (const key in kwArgs) {
      this[key] = kwArgs[key];
    }
  }

  save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const rwTx = IdbUserPlugin.rwTx();
      const reqAddResource = rwTx.add(this.serializeWithoutId());
      reqAddResource.onsuccess = (e) => {
        this.id = e.target.result;
        resolve(this.id);
      };
      reqAddResource.onerror = () => reject(new Error(`could not add userPlugin: ${this.name}`));
    });
  }

  update() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbUserPlugin.rwTx();
      const reqUpdateResource = rwTx.put(this.serialize());
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not update userPlugin: ${this.name}`));
    });
  }

  del() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbUserPlugin.rwTx();
      const reqUpdateResource = rwTx.delete(this.id);
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not delete userPlugin: ${this.name}`));
    });
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}
