import BaseEntity from 'get-set-fetch/lib/storage/base/BaseEntity';
import { IProjectStorage, IPluginDefinition, IExportOpt, ISite } from 'get-set-fetch-extension-commons';
import { IProjectConfigHash } from 'get-set-fetch-extension-commons/lib/project';
import Logger from '../logger/Logger';
import IdbSite from './IdbSite';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import IdbResource from './IdbResource';
import JsonUrlHelper from '../helpers/JsonUrlHelper';
import ExportHelper from '../helpers/ExportHelper';

const Log = Logger.getLogger('IdbProject');

/* eslint-disable class-methods-use-this */
export default class IdbProject extends BaseEntity implements IProjectStorage {
  // IndexedDB can't do partial update, define all resource properties to be stored
  get props() {
    return [ 'id', 'name', 'description', 'url', 'scenario', 'plugins' ];
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

      readReq.onsuccess = () => {
        const { result } = readReq;
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

      readReq.onsuccess = () => {
        const { result } = readReq;
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

      readReq.onsuccess = async () => {
        const { result } = readReq;
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

  static async getAllResourcesAsCsv(projectId: number, opts: Partial<IExportOpt>) {
    const project = await IdbProject.get(projectId);
    const sites = await IdbSite.getAll(project.id);

    const nestedResources = await Promise.all(
      sites.map(site => IdbResource.getAll(site.id)),
    );
    const resources = nestedResources.reduce((acc, val) => acc.concat(val), []);

    return ExportHelper.exportCsvArr(resources, opts);
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
  scenario: string;
  plugins: IPluginDefinition[];

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
      reqAddResource.onsuccess = async () => {
        this.id = reqAddResource.result as number;

        // also save the project url as a new site
        try {
          const site = new IdbSite({ name: `${this.name}-1`, url: this.url, projectId: this.id, crawlInProgress: false, plugins: this.plugins });
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
      reqUpdateResource.onsuccess = async () => {
        this.id = reqUpdateResource.result as number;

        // also update the corresponding site(s)
        try {
          const sites = await IdbSite.getAll(this.id);
          await Promise.all(sites.map(async site => {
            Object.assign(site, { url: this.url, plugins: this.plugins });
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

    sites.forEach(async site => {
      // open a new tab for the current site to be crawled into
      const tab = await ActiveTabHelper.create({}, () => this.onScrapeTabRemoved(site));

      // eslint-disable-next-line no-param-reassign
      site.tabId = tab.id;

      // start crawling
      site.crawl();
    });
  }

  onScrapeTabRemoved(site: ISite) {
    // eslint-disable-next-line no-param-reassign
    site.tabId = null;
    Log.trace(`site ${site.name} tabId is now invalidated`);
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}
