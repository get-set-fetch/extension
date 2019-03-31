import { BaseEntity } from 'get-set-fetch';
import Logger from '../logger/Logger';
import { IScenarioPackage } from 'get-set-fetch-extension-commons/lib/scenario';
import { NpmPackage } from 'get-set-fetch-extension-commons';

const Log = Logger.getLogger('IdbScenario');

export default class IdbScenarioPackage extends BaseEntity implements IScenarioPackage {

  // IndexedDB can't do partial update, define all resource properties to be stored
  get props() {
    return ['id', 'name', 'package', 'code', 'builtin'];
  }

  // get a read transaction
  static rTx() {
    return IdbScenarioPackage.db.transaction('ScenarioPackages').objectStore('ScenarioPackages');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbScenarioPackage.db.transaction('ScenarioPackages', 'readwrite').objectStore('ScenarioPackages');
  }

  static get(nameOrId): Promise<IdbScenarioPackage> {
    return new Promise((resolve, reject) => {
      const rTx = IdbScenarioPackage.rTx();
      const readReq = (Number.isInteger(nameOrId) ? rTx.get(nameOrId) : rTx.index('name').get(nameOrId));

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          resolve(new IdbScenarioPackage(result));
        }
      };
      readReq.onerror = () => {
        reject(new Error(`could not read resource: ${nameOrId}`));
      };
    });
  }

  static getAll(): Promise<IdbScenarioPackage[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbScenarioPackage.rTx();
      const readReq = rTx.getAll();

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          for (let i = 0; i < result.length; i += 1) {
            result[i] = new IdbScenarioPackage(result[i]);
          }
          resolve(result);
        }
      };
      readReq.onerror = () => reject(new Error('could not read ScenarioPackages'));
    });
  }

  static delAll() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbScenarioPackage.rwTx();
      const req = rwTx.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('could not clear ScenarioPackages'));
    });
  }

  static delSome(ids, resolve = null, reject = null) {
    if (resolve && reject) {
      const rwTx = IdbScenarioPackage.rwTx();
      const req = rwTx.delete(ids.pop());
      req.onsuccess = () => {
        if (ids.length === 0) {
          resolve();
        }
        else this.delSome(ids, resolve, reject);
      };
      req.onerror = () => reject(new Error('could not delSome ScenarioPackages'));
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
  package: NpmPackage;
  code: string;
  builtin: boolean = false;

  constructor(kwArgs: Partial<IScenarioPackage> = {}) {
    super();
    for (const key in kwArgs) {
      this[key] = kwArgs[key];
    }
  }

  save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const rwTx = IdbScenarioPackage.rwTx();
      const reqAddResource = rwTx.add(this.serializeWithoutId());
      reqAddResource.onsuccess = (e) => {
        this.id = e.target.result;
        resolve(this.id);
      };
      reqAddResource.onerror = () => reject(new Error(`could not add scenarioPackage: ${this.name}`));
    });
  }

  update() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbScenarioPackage.rwTx();
      const reqUpdateResource = rwTx.put(this.serialize());
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not update scenarioPackage: ${this.name}`));
    });
  }

  del() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbScenarioPackage.rwTx();
      const reqUpdateResource = rwTx.delete(this.id);
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not delete scenarioPackage: ${this.name}`));
    });
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}
