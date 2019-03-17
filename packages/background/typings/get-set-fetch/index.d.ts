declare module 'get-set-fetch' {
  export class BaseEntity {
    id: string|number;
    static db:any;
    
    static get(nameOrId:string|number):Promise<BaseEntity>;
    save():Promise<number>;
    serialize():any;
    static props():string[];
  }

  export class BaseNamedEntity extends BaseEntity {
    name: string;
  }

  export class BaseSite extends BaseEntity {
    constructor(name:string, url:any, opts:any, createDefaultPlugins:boolean);
    static getAll(projectId:number):Promise<BaseSite[]>;
    crawl(opts:any):Promise<any>;
    initCrawl(opts);
  }

  export class BaseResource extends BaseEntity {
    constructor(siteId:number|string, url:string, depth:number);
    static getAll(siteId:number, idbKey, instantiate?:boolean):Promise<BaseResource[]>;
  }

  export class BloomFilter {
    static create(maxEntries:number, probability:number, bitset:Buffer)
    constructor(m:number, k:number, bitset:Buffer)
  }
 
 }