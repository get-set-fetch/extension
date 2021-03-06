import BaseEntity from 'get-set-fetch/lib/storage/base/BaseEntity';
import { IPluginStorage } from 'get-set-fetch-extension-commons';

/* eslint-disable class-methods-use-this */

export default class IdbPlugin extends BaseEntity implements IPluginStorage {
  // IndexedDB can't do partial update, define all resource properties to be stored
  get props() {
    return [ 'id', 'name', 'code', 'scenarioId' ];
  }

  static cache: Map<string, string> = new Map<string, string>();

  // get a read transaction
  static rTx() {
    return IdbPlugin.db.transaction('Plugins').objectStore('Plugins');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbPlugin.db.transaction('Plugins', 'readwrite').objectStore('Plugins');
  }

  static get(nameOrId: string|number): Promise<IdbPlugin> {
    return new Promise((resolve, reject) => {
      const rTx = IdbPlugin.rTx();
      const readReq = (Number.isInteger(nameOrId as number) ? rTx.get(nameOrId) : rTx.index('name').get(nameOrId));

      readReq.onsuccess = () => {
        const { result } = readReq;
        if (!result) {
          resolve(null);
        }
        else {
          resolve(new IdbPlugin(result));
        }
      };
      readReq.onerror = () => {
        reject(new Error(`could not read resource: ${nameOrId}`));
      };
    });
  }

  static getAll(): Promise<IdbPlugin[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbPlugin.rTx();
      const readReq = rTx.getAll();

      readReq.onsuccess = () => {
        const { result } = readReq;
        if (!result) {
          resolve(null);
        }
        else {
          for (let i = 0; i < result.length; i += 1) {
            result[i] = new IdbPlugin(result[i]);
          }
          resolve(result);
        }
      };
      readReq.onerror = () => reject(new Error('could not read Plugins'));
    });
  }

  static delAll() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbPlugin.rwTx();
      const req = rwTx.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('could not clear Plugins'));
    });
  }

  static delSome(ids, resolve = null, reject = null) {
    if (resolve && reject) {
      const rwTx = IdbPlugin.rwTx();
      const req = rwTx.delete(ids.pop());
      req.onsuccess = () => {
        if (ids.length === 0) {
          resolve();
        }
        else this.delSome(ids, resolve, reject);
      };
      req.onerror = () => reject(new Error('could not delSome Plugins'));
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
  name: string;
  code: string;
  scenarioId: number;
  builtin: boolean;

  constructor(kwArgs: Partial<IPluginStorage> = {}) {
    super();

    Object.keys(kwArgs).forEach(kwArgKey => {
      this[kwArgKey] = kwArgs[kwArgKey];
    });

    if (!kwArgs.scenarioId) {
      this.scenarioId = null;
    }
  }

  save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const rwTx = IdbPlugin.rwTx();
      const reqAddResource: IDBRequest<IDBValidKey> = rwTx.add(this.serializeWithoutId());
      reqAddResource.onsuccess = () => {
        this.id = reqAddResource.result as number;
        resolve(this.id);
      };
      reqAddResource.onerror = () => reject(new Error(`could not add plugin: ${this.name}`));
    });
  }

  update() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbPlugin.rwTx();
      const reqUpdateResource = rwTx.put(this.serialize());
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not update plugin: ${this.name}`));
    });
  }

  del() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbPlugin.rwTx();
      const reqUpdateResource = rwTx.delete(this.id);
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not delete plugin: ${this.name}`));
    });
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}
