import { BaseEntity } from 'get-set-fetch';

/* eslint-disable class-methods-use-this */
class IdbUserPlugin extends BaseEntity {
  // get a read transaction
  static rTx() {
    return IdbUserPlugin.db.transaction('UserPlugins').objectStore('UserPlugins');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbUserPlugin.db.transaction('UserPlugins', 'readwrite').objectStore('UserPlugins');
  }

  static async populateUserPlugins() {
    const userPlugins = await this.getAll();
    if (userPlugins.length === 0) {
      const extractTitlePlugin = new IdbUserPlugin(
        'ExtractTitle',
        'class ExtractTitle { static test() {return true}; static apply() { return {info: {title: document.title }} }; }',
      );
      await extractTitlePlugin.save();
    }
  }

  static get(nameOrId) {
    return new Promise((resolve, reject) => {
      const rTx = IdbUserPlugin.rTx();
      const readReq = (Number.isInteger(nameOrId) ? rTx.get(nameOrId) : rTx.index('name').get(nameOrId));

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          resolve(Object.assign(new IdbUserPlugin(), result));
        }
      };
      readReq.onerror = () => {
        reject(new Error(`could not read resource: ${nameOrId}`));
      };
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      const rTx = IdbUserPlugin.rTx();
      const readReq = rTx.getAll();

      readReq.onsuccess = (e) => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          for (let i = 0; i < result.length; i += 1) {
            result[i] = Object.assign(new IdbUserPlugin(), result[i]);
          }
          resolve(result);
        }
      };
      readReq.onerror = () => reject(new Error('could not read UserPlugins'));
    });
  }

  static delAll() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbUserPlugin.rwTx();
      const req = rwTx.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('could not clear UserPlugins'));
    });
  }

  static delSome(ids, resolve = null, reject = null) {
    if (resolve && reject) {
      const rwTx = IdbUserPlugin.rwTx();
      const req = rwTx.delete(ids.pop());
      req.onsuccess = () => {
        if (ids.length === 0) {
          resolve();
        }
        else this.delSome(ids, resolve, reject);
      };
      req.onerror = () => reject(new Error('could not delSome UserPlugins'));
      return null;
    }

    // eslint-disable-next-line no-shadow
    return new Promise((resolve, reject) => {
      if (ids && ids.length > 0) {
        this.delSome(ids, resolve, reject);
      }
      else {
        resolve();
      }
    });
  }

  constructor(name, code) {
    super();
    this.name = name;
    this.code = code;
  }

  save() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbUserPlugin.rwTx();
      const reqAddResource = rwTx.add(this.serializeWithoutId());
      reqAddResource.onsuccess = (e) => {
        this.id = e.target.result;
        resolve(this.id);
      };
      reqAddResource.onerror = () => reject(new Error(`could not add userPlugin: ${this.name}`));
    });
  }

  update() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbUserPlugin.rwTx();
      const reqUpdateResource = rwTx.put(this.serialize());
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not update userPlugin: ${this.name}`));
    });
  }

  del() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbUserPlugin.rwTx();
      const reqUpdateResource = rwTx.delete(this.id);
      reqUpdateResource.onsuccess = () => resolve();
      reqUpdateResource.onerror = () => reject(new Error(`could not delete userPlugin: ${this.name}`));
    });
  }

  // IndexedDB can't do partial update, define all resource properties to be stored
  get props() {
    return ['id', 'name', 'code'];
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}

module.exports = IdbUserPlugin;