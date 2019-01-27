import { BaseEntity } from 'get-set-fetch';
import Logger from '../logger/Logger';

const Log = Logger.getLogger('IdbScenario');

/* eslint-disable class-methods-use-this */
export default class IdbScenario extends BaseEntity {

  // IndexedDB can't do partial update, define all resource properties to be stored
  get props() {
    return ['id', 'name', 'description', 'code'];
  }

  // get a read transaction
  static rTx() {
    return IdbScenario.db.transaction('Scenarios').objectStore('Scenarios');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbScenario.db.transaction('Scenarios', 'readwrite').objectStore('Scenarios');
  }

  static get(nameOrId): Promise<IdbScenario> {
    return new Promise((resolve, reject) => {
      const rTx = IdbScenario.rTx();
      const readReq = (Number.isInteger(nameOrId) ? rTx.get(nameOrId) : rTx.index('name').get(nameOrId));

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          resolve(Object.assign(new IdbScenario(null, null, null), result));
        }
      };
      readReq.onerror = () => {
        reject(new Error(`could not read resource: ${nameOrId}`));
      };
    });
  }

  static getAll(): Promise<IdbScenario[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbScenario.rTx();
      const readReq = rTx.getAll();

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          for (let i = 0; i < result.length; i += 1) {
            result[i] = Object.assign(new IdbScenario(null, null, null), result[i]);
          }
          resolve(result);
        }
      };
      readReq.onerror = () => reject(new Error('could not read Scenarios'));
    });
  }

  static delAll() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbScenario.rwTx();
      const req = rwTx.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('could not clear Scenarios'));
    });
  }

  static delSome(ids, resolve = null, reject = null) {
    if (resolve && reject) {
      const rwTx = IdbScenario.rwTx();
      const req = rwTx.delete(ids.pop());
      req.onsuccess = () => {
        if (ids.length === 0) {
          resolve();
        }
        else this.delSome(ids, resolve, reject);
      };
      req.onerror = () => reject(new Error('could not delSome Scenarios'));
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
  name: string;
  description: string;
  code: string;

  constructor(name, description, code) {
    super();
    this.name = name;
    this.description = description;
    this.code = code;
  }

  save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const rwTx = IdbScenario.rwTx();
      const reqAddResource = rwTx.add(this.serializeWithoutId());
      reqAddResource.onsuccess = (e) => {
        this.id = e.target.result;
        resolve(this.id);
      };
      reqAddResource.onerror = () => reject(new Error(`could not add project: ${this.name}`));
    });
  }

  update() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbScenario.rwTx();
      const reqUpdateResource = rwTx.put(this.serialize());
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not update project: ${this.name}`));
    });
  }

  del() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbScenario.rwTx();
      const reqUpdateResource = rwTx.delete(this.id);
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not delete project: ${this.name}`));
    });
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}
