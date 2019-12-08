import BaseEntity from 'get-set-fetch/lib/storage/base/BaseEntity';
import IdbSite from './IdbSite';
import IdbResource from './IdbResource';
import IdbPlugin from './IdbPlugin';
import IdbLog from './IdbLog';
import IdbSetting from './IdbSetting';
import IdbProject from './IdbProject';
import IdbScenarioPackage from './IdbScenarioPackage';

export default class IdbStorage {
  static init(): Promise<{
    Site: typeof IdbSite;
    Project: typeof IdbProject;
    ScenarioPackage: typeof IdbScenarioPackage;
    Resource: typeof IdbResource;
    Plugin: typeof IdbPlugin;
    Log: typeof IdbLog;
    Setting: typeof IdbSetting;
  }> {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('gsf_db', 1);

      openRequest.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = openRequest.result;
        if (!db.objectStoreNames.contains('Sites')) {
          const siteStore = db.createObjectStore('Sites', { keyPath: 'id', autoIncrement: true });
          siteStore.createIndex('name', 'name', { unique: true });

          /* create an index for retrieving all sites by projectId */
          siteStore.createIndex('projectId', 'projectId', { unique: false });
        }

        if (!db.objectStoreNames.contains('Projects')) {
          const projectStore = db.createObjectStore('Projects', { keyPath: 'id', autoIncrement: true });
          projectStore.createIndex('name', 'name', { unique: true });
        }

        if (!db.objectStoreNames.contains('ScenarioPackages')) {
          const scenarioStore = db.createObjectStore('ScenarioPackages', { keyPath: 'id', autoIncrement: true });
          scenarioStore.createIndex('name', 'name', { unique: true });
        }

        if (!db.objectStoreNames.contains('Resources')) {
          const resourceStore = db.createObjectStore('Resources', { keyPath: 'id', autoIncrement: true });
          /* don't enforce url as unique, same site may be scrapped using multiple scenarios */
          resourceStore.createIndex('url', 'url', { unique: false });

          /* create an index for retrieving all resources by siteId */
          resourceStore.createIndex('siteId', 'siteId', { unique: false });

          /* create a compound index for getResourceToCrawl */
          resourceStore.createIndex('getResourceToCrawl', [ 'siteId', 'crawlInProgress', 'crawledAt' ], { unique: false });
        }

        if (!db.objectStoreNames.contains('Plugins')) {
          const pluginStore = db.createObjectStore('Plugins', { keyPath: 'id', autoIncrement: true });
          pluginStore.createIndex('name', 'name', { unique: true });
        }

        if (!db.objectStoreNames.contains('Logs')) {
          const logStore = db.createObjectStore('Logs', { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('Settings')) {
          const settingStore = db.createObjectStore('Settings', { keyPath: 'key', autoIncrement: false });
          settingStore.createIndex('key', 'key', { unique: true });
        }
      };

      openRequest.onsuccess = (e: any) => {
        BaseEntity.db = openRequest.result;
        resolve({
          Site: IdbSite,
          Project: IdbProject,
          ScenarioPackage: IdbScenarioPackage,
          Resource: IdbResource,
          Plugin: IdbPlugin,
          Log: IdbLog,
          Setting: IdbSetting,
        });
      };

      openRequest.onerror = () => {
        reject(new Error('error opening db'));
      };
    });
  }

  static close() {
    return BaseEntity.db.close();
  }
}
