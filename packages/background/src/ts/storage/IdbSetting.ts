import BaseEntity from 'get-set-fetch/lib/storage/base/BaseEntity';
import { ISetting } from 'get-set-fetch-extension-commons';

/* eslint-disable class-methods-use-this */
export default class IdbSetting extends BaseEntity implements ISetting {
  // get a read transaction
  static rTx() {
    return IdbSetting.db.transaction('Settings').objectStore('Settings');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbSetting.db.transaction('Settings', 'readwrite').objectStore('Settings');
  }

  static get(key): Promise<IdbSetting> {
    return new Promise((resolve, reject) => {
      const rTx = IdbSetting.rTx();
      const readReq = rTx.get(key);

      readReq.onsuccess = () => {
        const { result } = readReq;
        if (!result) {
          resolve(null);
        }
        else {
          resolve(new IdbSetting(result));
        }
      };
      readReq.onerror = () => {
        reject(new Error(`could not read setting: ${key}`));
      };
    });
  }

  static getAll(): Promise<IdbSetting[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbSetting.rTx();
      const readReq = rTx.getAll();

      readReq.onsuccess = () => {
        const { result } = readReq;
        if (!result) {
          resolve(null);
        }
        else {
          for (let i = 0; i < result.length; i += 1) {
            result[i] = new IdbSetting(result[i]);
          }
          resolve(result);
        }
      };
      readReq.onerror = () => reject(new Error('could not read Settings'));
    });
  }

  id: number;
  key: string;
  val;

  constructor(kwArgs: Partial<ISetting> = {}) {
    super();

    Object.keys(kwArgs).forEach(kwArgKey => {
      this[kwArgKey] = kwArgs[kwArgKey];
    });
  }

  save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const rwTx = IdbSetting.rwTx();
      const reqAddResource = rwTx.add(this.serialize());
      reqAddResource.onsuccess = () => {
        this.id = reqAddResource.result as number;
        resolve(this.id);
      };
      reqAddResource.onerror = () => reject(new Error(`could not add setting entry: ${this.key}`));
    });
  }

  update() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbSetting.rwTx();
      const reqUpdateResource = rwTx.put(this.serialize());
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not update setting: ${this.key}`));
    });
  }

  // IndexedDB can't do partial update, define all resource properties to be stored
  get props() {
    return [ 'key', 'val' ];
  }
}
