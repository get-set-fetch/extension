import { BaseEntity } from 'get-set-fetch';
import IdbSite from './IdbSite';
import IdbResource from './IdbResource';

class IdbStorage {
  static init() {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('gsf_db', 1);

      openRequest.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('Sites')) {
          const siteStore = db.createObjectStore('Sites', { keyPath: 'id', autoIncrement: true });
          siteStore.createIndex('name', 'name', { unique: true });
        }
        if (!db.objectStoreNames.contains('Resources')) {
          const resourceStore = db.createObjectStore('Resources', { keyPath: 'id', autoIncrement: true });
          /* don't enforce url as unique, same site may be scrapped using multiple scenarios */
          resourceStore.createIndex('url', 'url', { unique: false });

          /* create a compound index for getResourceToCrawl */
          resourceStore.createIndex('getResourceToCrawl', ['siteId', 'crawlInProgress', 'crawledAt'], { unique: false });
        }
      };

      openRequest.onsuccess = (e) => {
        BaseEntity.db = e.target.result;
        resolve({ Site: IdbSite, Resource: IdbResource });
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

module.exports = IdbStorage;
