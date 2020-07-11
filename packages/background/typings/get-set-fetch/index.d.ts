declare module 'get-set-fetch/lib/storage/base/BaseEntity' {
  class BaseEntity {
    id: string|number;
    static db:IDBDatabase;
    
    static get(nameOrId:string|number):Promise<BaseEntity>;
    save():Promise<number>;
    serialize():any;
    static props():string[];

    constructor(kwArgs?:any);
  }

  export = BaseEntity;
}

declare module 'get-set-fetch/lib/storage/base/BaseResource' {
  class BaseResource {
    id: string|number;
    static db:any;

    static get(nameOrId:string|number):Promise<any>;
    save():Promise<number>;
    serialize():any;
    static props():string[];

    constructor(siteId:number|string, url:string, depth:number);
    static getAll(siteId:number, idbKey, instantiate?:boolean):Promise<BaseResource[]>;
  }

  export = BaseResource;
}

declare module 'get-set-fetch/lib/filters/bloom/BloomFilter' {
  class BloomFilter {
    static create(maxEntries:number, probability:number, bitset:Buffer);
    
    constructor(m:number, k:number, bitset:Buffer);
    
    test(val: any):boolean;
    add(val: any):void;

    bitset:Buffer;
  }

  export = BloomFilter;
}