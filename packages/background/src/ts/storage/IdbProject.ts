import { BaseEntity } from 'get-set-fetch';
import Logger from '../logger/Logger';
import IdbSite, { IPluginDefinition } from './IdbSite';
import ActiveTabHelper from '../helpers/ActiveTabHelper';

const Log = Logger.getLogger('IdbProject');

/* eslint-disable class-methods-use-this */

interface IProject {
  id: number;
  name: string;
  description: string;
  url: string;
  scenarioId: string;
  scenarioProps: object;
  pluginDefinitions: IPluginDefinition[];
}

export default class IdbProject extends BaseEntity {

  // IndexedDB can't do partial update, define all resource properties to be stored
  get props() {
    return ['id', 'name', 'description', 'url', 'scenarioId', 'scenarioProps', 'pluginDefinitions'];
  }

  // get a read transaction
  static rTx() {
    return IdbProject.db.transaction('Projects').objectStore('Projects');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbProject.db.transaction('Projects', 'readwrite').objectStore('Projects');
  }

  static get(nameOrId): Promise<IdbProject> {
    return new Promise((resolve, reject) => {
      const rTx = IdbProject.rTx();
      const readReq = (Number.isInteger(nameOrId) ? rTx.get(nameOrId) : rTx.index('name').get(nameOrId));

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          resolve(new IdbProject(result));
        }
      };
      readReq.onerror = () => {
        reject(new Error(`could not read resource: ${nameOrId}`));
      };
    });
  }

  static getAll(): Promise<IdbProject[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbProject.rTx();
      const readReq = rTx.getAll();

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          for (let i = 0; i < result.length; i += 1) {
            result[i] = new IdbProject(result[i]);
          }
          resolve(result);
        }
      };
      readReq.onerror = () => reject(new Error('could not read Projects'));
    });
  }

  static delAll() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbProject.rwTx();
      const req = rwTx.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('could not clear Projects'));
    });
  }

  static delSome(ids, resolve = null, reject = null) {
    if (resolve && reject) {
      const rwTx = IdbProject.rwTx();
      const req = rwTx.delete(ids.pop());
      req.onsuccess = () => {
        if (ids.length === 0) {
          resolve();
        }
        else this.delSome(ids, resolve, reject);
      };
      req.onerror = () => reject(new Error('could not delSome Projects'));
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
  url: string;
  scenarioId: string;
  scenarioProps: object;
  pluginDefinitions: IPluginDefinition[];

  constructor(kwArgs: Partial<IProject> = {}) {
    super();
    for (const key in kwArgs) {
      this[key] = kwArgs[key];
    }
  }

  save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const rwTx = IdbProject.rwTx();
      const reqAddResource = rwTx.add(this.serializeWithoutId());
      reqAddResource.onsuccess = async (e) => {
        this.id = e.target.result;

        // also save the project url as a new site
        try {
          const site = new IdbSite({ name: `${this.name}-1`, url: this.url, projectId: this.id, pluginDefinitions: this.pluginDefinitions });
          await site.save();
          resolve(this.id);
        }
        catch (err) {
          reject(err);
        }
      };
      reqAddResource.onerror = () => reject(new Error(`could not add project: ${this.name}`));
    });
  }

  update() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbProject.rwTx();
      const reqUpdateResource = rwTx.put(this.serialize());
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not update project: ${this.name}`));
    });
  }

  del() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbProject.rwTx();
      const reqUpdateResource = rwTx.delete(this.id);
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not delete project: ${this.name}`));
    });
  }

  async crawl() {
    const sites = await IdbSite.getAll(this.id);

    // tslint:disable-next-line:prefer-for-of
    for (let i: number = 0; i < sites.length; i++) {
      // open a new tab for the current site to be crawled into
      const tab = await ActiveTabHelper.create();
      sites[i].tabId = tab.id;

      // start crawling
      sites[i].crawl(sites[i].opts.crawl);
    }
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}
