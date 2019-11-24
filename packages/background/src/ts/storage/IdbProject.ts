import { BaseEntity } from 'get-set-fetch';
import { IProjectStorage, IPluginDefinition, IProjectCrawlOpts } from 'get-set-fetch-extension-commons';
import { IProjectConfigHash, IProjectScenarioOpts } from 'get-set-fetch-extension-commons/lib/project';
import Logger from '../logger/Logger';
import IdbSite from './IdbSite';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import IdbResource from './IdbResource';
import JsonUrlHelper from '../helpers/JsonUrlHelper';

const Log = Logger.getLogger('IdbProject');

/* eslint-disable class-methods-use-this */
export default class IdbProject extends BaseEntity implements IProjectStorage {
  // IndexedDB can't do partial update, define all resource properties to be stored
  get props() {
    return [ 'id', 'name', 'description', 'url', 'crawlOpts', 'scenarioOpts', 'pluginDefinitions' ];
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

      readReq.onsuccess = e => {
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

  static async encodeConfigHash(nameOrId): Promise<IProjectConfigHash> {
    const projectStorage: IProjectStorage = await IdbProject.get(nameOrId);

    // remove id references from the exportable config
    delete projectStorage.id;
    delete projectStorage.scenarioOpts.id;
    const configHash = JsonUrlHelper.encode(projectStorage);

    return { hash: configHash };
  }

  static async decodeConfigHash(config: IProjectConfigHash): Promise<IProjectStorage> {
    const projectStorage: IProjectStorage = Object.assign({}, JsonUrlHelper.decode(config.hash)) as IProjectStorage;
    return projectStorage;
  }

  static getAll(): Promise<IdbProject[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbProject.rTx();
      const readReq = rTx.getAll();

      readReq.onsuccess = e => {
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

      readReq.onsuccess = async e => {
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

    const nestedResources = await Promise.all(
      sites.map(site => IdbResource.getAll(site.id)),
    );
    const resources = nestedResources.reduce((acc, val) => acc.concat(val), []);

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
      projectIds.map(async projectId => {
        const siteIds = await IdbSite.getAllIds(projectId);
        await IdbSite.delSome(siteIds);
        await IdbProject.delSingle(projectId);
      }),
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
  crawlOpts: IProjectCrawlOpts;
  scenarioOpts: IProjectScenarioOpts;
  pluginDefinitions: IPluginDefinition[];

  constructor(kwArgs: Partial<IProjectStorage> = {}) {
    super();

    Object.keys(kwArgs).forEach(kwArgKey => {
      this[kwArgKey] = kwArgs[kwArgKey];
    });
  }

  save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const rwTx = IdbProject.rwTx();
      const reqAddResource = rwTx.add(this.serializeWithoutId());
      reqAddResource.onsuccess = async e => {
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
      reqUpdateResource.onsuccess = async e => {
        this.id = e.target.result;

        // also update the corresponding site(s)
        try {
          const sites = await IdbSite.getAll(this.id);
          await Promise.all(sites.map(async site => {
            Object.assign(site, { url: this.url, pluginDefinitions: this.pluginDefinitions });
            await site.update();
          }));

          resolve(this.id);
        }
        catch (err) {
          reject(err);
        }
      };
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

    return Promise.all(
      sites.map(async site => {
        // open a new tab for the current site to be crawled into
        const tab = await ActiveTabHelper.create();
        // eslint-disable-next-line no-param-reassign
        site.tabId = tab.id;

        // start crawling
        site.crawl();
      }),
    );
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}
