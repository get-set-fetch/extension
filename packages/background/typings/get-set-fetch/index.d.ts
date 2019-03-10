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

  export interface IResource {
    crawledAt: any;
    id: number;
    url: string;
    crawlInProgress: boolean;
    depth: number;
    siteId: number;
    mediaType: string;
    blob: any;
    info: any;
  }

  export interface IPluginDefinition {
    name: string;
    opts: object;
  }

  export interface ISite {
    id: number;
    projectId: number;
    name: string;
    url: string;
    tabId: any;

    pluginDefinitions: IPluginDefinition[];
    plugins: any;

    opts: {
      crawl: {
        maxConnections: number,
        maxResources: number,
        delay: number
      },
      resourceFilter: {
        maxEntries: number,
        probability: number
      }
    };
  }

  export interface IPlugin {
    test(resource:IResource):boolean;
    apply(site:ISite, resource: IResource):any;
  }
 }