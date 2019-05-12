import { BaseEntity } from 'get-set-fetch';

interface ILog {
  date: Date;
  level: number;
  cls: string;
  msg: string;
  stack?: string;
  id: number;
}
export default class IdbLog extends BaseEntity {
  // IndexedDB can't do partial update, define all resource properties to be stored
  get props() {
    return [ 'id', 'date', 'level', 'cls', 'msg', 'stack' ];
  }

  // get a read transaction
  static rTx() {
    return IdbLog.db.transaction('Logs').objectStore('Logs');
  }

  // get a read-write transaction
  static rwTx() {
    return IdbLog.db.transaction('Logs', 'readwrite').objectStore('Logs');
  }

  static getAll(): Promise<IdbLog[]> {
    return new Promise((resolve, reject) => {
      const rTx = IdbLog.rTx();
      const readReq = rTx.getAll();

      readReq.onsuccess = e => {
        const { result } = e.target;
        if (!result) {
          resolve(null);
        }
        else {
          for (let i = 0; i < result.length; i += 1) {
            result[i] = Object.assign(new IdbLog(result[i]), { date: result[i].date.toISOString() });
          }
          resolve(result);
        }
      };
      readReq.onerror = () => reject(new Error('could not read Logs'));
    });
  }

  static delAll() {
    return new Promise((resolve, reject) => {
      const rwTx = IdbLog.rwTx();
      const req = rwTx.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('could not clear Logs'));
    });
  }

  date: Date;
  level: number;
  cls: string;
  msg: string;
  stack: string;
  id: number;

  constructor(kwArgs: Partial<ILog> = {}) {
    super();

    Object.keys(kwArgs).forEach(kwArgKey => {
      this[kwArgKey] = kwArgs[kwArgKey];
    });

    this.date = kwArgs.date ? kwArgs.date : new Date();
  }

  save(): Promise<number> {
    // console.log(`log: ${this.cls} ${this.msg}`);
    return new Promise((resolve, reject) => {
      const rwTx = IdbLog.rwTx();
      const reqAddResource = rwTx.add(this.serializeWithoutId());
      reqAddResource.onsuccess = e => {
        this.id = e.target.result;
        resolve(this.id);
      };
      reqAddResource.onerror = () => reject(new Error(`could not add log entry: ${this.msg}`));
    });
  }

  serializeWithoutId() {
    const serialized = this.serialize();
    delete serialized.id;
    return serialized;
  }
}
