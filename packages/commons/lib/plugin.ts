import { IResource } from './resource';
import { ISite } from './site';
import { IEnhancedJSONSchema } from './scenario';
import { SchemaHelper } from './schema/SchemaHelper';
import { IModuleStorage } from './storage';

export interface IPluginStorage extends IModuleStorage {
  scenarioId?: number;
}

export interface IPluginDefinition {
  name: string;
  opts?: IPluginOpts;
}

export interface IPluginOpts {
  runInTab?: boolean;
  domManipulation?: boolean;
  [key: string]: any;
}

export abstract class BasePlugin {
  opts: IPluginOpts;
  result: any;

  constructor(opts = {}) {
    this.opts = SchemaHelper.instantiate(this.getOptsSchema(), opts);
    this.result = {};
  }

  getValType(val): 'literal' | 'array' | 'object' {
    if (val === null || val === undefined) return undefined;

    if (val.constructor === String || val.constructor === Number || val.constructor === Boolean) return 'literal';

    if (Array.isArray(val)) return 'array';

    if (val.constructor === Object) return 'object';
  }

  deepEqual(x, y) {
    const xValType = this.getValType(x);
    const yValType = this.getValType(y);

    // different types
    if (xValType !== yValType) return false;

    // different scalar values
    if (xValType === null || xValType === 'literal') return x === y;

    // different key length
    if (Object.keys(x).length !== Object.keys(y).length) return false;

    // different keys
    for (var prop in x) {
      if (y.hasOwnProperty(prop)) {
        if (!this.deepEqual(x[prop], y[prop])) return false;
      }
      else {
        return false;
      }
    }

    // all test passed
    return true;
  }

  diffAndMergeResult(newResult: any, oldResult: any = this.result) {
    Object.keys(newResult).forEach(key => {
      const childContentType = this.getValType(newResult[key]);
      switch (childContentType) {
        case 'literal':
          oldResult[key] = newResult[key];
          break;
        case 'array':
          if (!oldResult[key]) {
            oldResult[key] = newResult[key];
          }
          else {
            // remove from the new array, already existing elms
            newResult[key] = newResult[key].filter(newElm => {
              return oldResult[key].find(oldElm => this.deepEqual(newElm, oldElm)) === undefined
            })
            // add the new elms to the existing
            oldResult[key].push(...newResult[key])
          }
          break;
        case 'object':
          this.diffAndMergeResult(newResult[key], oldResult[key]);
          break;
      }
    });

    return newResult;
  }


  abstract getOptsSchema(): IEnhancedJSONSchema;

  abstract test(site: ISite, resource: IResource): boolean;
  abstract apply(site: ISite, resource: IResource): any;
}