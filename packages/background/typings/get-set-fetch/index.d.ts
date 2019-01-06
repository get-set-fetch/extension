declare module 'get-set-fetch' {
  export class BaseEntity {
    static db:any;
    
    static get(prop:string):Promise<BaseEntity>;
    serialize():any;
    static props():string[];
  }

  export class BaseSite extends BaseEntity {
    constructor(name:string, url:any, opts:any, createDefaultPlugins:boolean);
    static getAll():Promise<BaseSite[]>;
    crawl(opts:any):Promise<any>;
  }

  export class BaseResource extends BaseEntity {
    constructor(siteId:string, url:string, depth:number);
    static getAll(siteId, idbKey, instantiate?:boolean):Promise<BaseResource[]>;
  }

  export class BloomFilter {
    static create(maxEntries:number, probability:number, bitset:Buffer)
    constructor(m:number, k:number, bitset:Buffer)
  }
 }