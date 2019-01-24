import { BaseEntity } from 'get-set-fetch';

/* eslint-disable class-methods-use-this */
export default class IdbSetting extends BaseEntity {
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

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          resolve(Object.assign(new IdbSetting(null, null), result));
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

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          for (let i = 0; i < result.length; i += 1) {
            result[i] = Object.assign(new IdbSetting(null, null), result[i]);
          }
          resolve(result);
        }
      };
      readReq.onerror = () => reject(new Error('could not read Settings'));
    });
  }

  id: number;
  key: string;
  val: string;

  constructor(key, val) {
    super();
    this.key = key;
    this.val = val;
  }

  save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const rwTx = IdbSetting.rwTx();
      const reqAddResource = rwTx.add(this.serialize());
      reqAddResource.onsuccess = (e) => {
        this.id = e.target.result;
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
    return ['key', 'val'];
  }
}
