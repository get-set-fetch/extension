import { BaseEntity } from 'get-set-fetch';
import { IPluginDefinition } from 'get-set-fetch-extension-commons';
import Logger from '../logger/Logger';
import IdbSite from './IdbSite';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import IdbResource from './IdbResource';

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

  static getAllIds(): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbProject.rTx();
      const readReq = rTx.getAll();

      readReq.onsuccess = async (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          const projectIds = result.map(row => row.id);
          resolve(projectIds);
        }
      };
      readReq.onerror = () => reject(new Error('could not read projects'));
    });
  }

  static async getAllResources(projectId: number): Promise<IdbResource[]> {
    const project = await IdbProject.get(projectId);
    const sites = await IdbSite.getAll(project.id);
    let resources = [];

    for (let i: number = 0; i < sites.length; i++) {
      const currentResources = await IdbResource.getAll(sites[i].id);
      resources = resources.concat(currentResources);
    }

    return resources;
  }

  static delAll() {
    return new Promise(async (resolve, reject) => {
      try {
        const projectIds = await IdbProject.getAllIds();
        await IdbProject.delSome(projectIds);
        resolve();
      }
      catch (err) {
        reject(err);
      }
    });
  }

  static async delSome(projectIds) {
    return Promise.all(
      projectIds.map(async (projectId) => {
        const siteIds = await IdbSite.getAllIds(projectId);
        await IdbSite.delSome(siteIds);
        await IdbProject.delSingle(projectId);
      })
    );
  }

  static delSingle(projectId) {
    return new Promise((resolve, reject) => {
      const rwTx = IdbProject.rwTx();
      const req = rwTx.delete(projectId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error(`could not delete project: ${projectId}`));
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
    return new Promise(async (resolve, reject) => {
      try {
        // delete linked sites
        const siteIds = await IdbSite.getAllIds(this.id);
        await IdbSite.delSome(siteIds);

         // delete project
        await IdbProject.delSingle(this.id);
        resolve();
      }
      catch (error) {
        reject(error);
      }
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
      sites[i].crawl();
    }
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}
