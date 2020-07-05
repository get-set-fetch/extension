/* eslint-disable no-await-in-loop */
import BaseEntity from 'get-set-fetch/lib/storage/base/BaseEntity';
import { IExportResult } from 'get-set-fetch-extension-commons';
import IdbSite from './IdbSite';
import IdbResource from './IdbResource';
import IdbPlugin from './IdbPlugin';
import IdbLog from './IdbLog';
import IdbSetting from './IdbSetting';
import IdbProject from './IdbProject';
import IdbScenario from './IdbScenario';

export default class IdbStorage {
  static init(): Promise<{
    Site: typeof IdbSite;
    Project: typeof IdbProject;
    Scenario: typeof IdbScenario;
    Resource: typeof IdbResource;
    Plugin: typeof IdbPlugin;
    Log: typeof IdbLog;
    Setting: typeof IdbSetting;
  }> {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('gsf_db', 1);

      openRequest.onupgradeneeded = () => {
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

        if (!db.objectStoreNames.contains('Scenarios')) {
          const scenarioStore = db.createObjectStore('Scenarios', { keyPath: 'id', autoIncrement: true });
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

      openRequest.onsuccess = () => {
        BaseEntity.db = openRequest.result;
        resolve({
          Site: IdbSite,
          Project: IdbProject,
          Scenario: IdbScenario,
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

  static getStores() {
    return Array.from(BaseEntity.db.objectStoreNames);
  }

  static exportStore(store: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records = [];

      const request: IDBRequest<IDBCursorWithValue> = IdbSite.db.transaction(store).objectStore(store).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          records.push(cursor.value);
          cursor.continue();
        }
        else {
          resolve(records);
        }
      };
      request.onerror = event => {
        reject(new Error(JSON.stringify(event)));
      };
    });
  }

  static async exportStores(stores: string[]): Promise<IExportResult> {
    if (!stores || stores.length === 0) return { error: 'No stores selected.' };

    try {
      const jsonStores: { [key: string]: any[]} = {};

      for (let i = 0; i < stores.length; i += 1) {
        const store = stores[i];
        // eslint-disable-next-line no-await-in-loop
        const records = await IdbStorage.exportStore(store);
        jsonStores[store] = records;
      }

      return {
        url: URL.createObjectURL(new Blob([ JSON.stringify(jsonStores) ], { type: 'application/json' })),
      };
    }
    catch (error) {
      return { error };
    }
  }

  static async clearStore(store: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const clearRequest: IDBRequest = IdbSite.db.transaction(store, 'readwrite').objectStore(store).clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(new Error(`could not clear ${store}`));
    });
  }

  static importStoreRecords(store: string, records: any[], resolve = null, reject = null) {
    if (resolve && reject) {
      const addRequest: IDBRequest = IdbSite.db.transaction(store, 'readwrite').objectStore(store).add(records.pop());
      addRequest.onsuccess = () => {
        if (records.length === 0) {
          resolve();
        }
        else this.importStoreRecords(store, records, resolve, reject);
      };
      addRequest.onerror = () => reject(new Error(`could not import records on store ${store}`));
      return null;
    }

    // eslint-disable-next-line no-shadow
    return new Promise((resolve, reject) => {
      if (records && records.length > 0) {
        this.importStoreRecords(store, records, resolve, reject);
      }
      else {
        resolve();
      }
    });
  }

  static async importStores(stores: string[], content: string): Promise<IExportResult> {
    if (!stores || stores.length === 0) return { error: 'No stores selected.' };

    try {
      const jsonContent = JSON.parse(content);

      for (let i = 0; i < stores.length; i += 1) {
        const store = stores[i];

        if (!Object.prototype.hasOwnProperty.call(jsonContent, store)) {
          return { error: `File doesn't contain data for ${store}` };
        }

        if (!Array.isArray(jsonContent[store])) {
          return { error: `Expecting records array for store ${store}` };
        }

        await IdbStorage.clearStore(store);
        await IdbStorage.importStoreRecords(store, jsonContent[store]);
      }

      return null;
    }
    catch (error) {
      return { error };
    }
  }
}
