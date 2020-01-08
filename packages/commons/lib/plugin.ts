import { IResource } from './resource';
import { ISite } from './site';
import { IEnhancedJSONSchema } from './scenario';
import { SchemaHelper } from './schema/SchemaHelper';
import { IModuleStorage } from './storage';

export interface IPluginStorage extends IModuleStorage {
  scenarioId?: number;
}

export interface IPluginSchemas {
  opts: IEnhancedJSONSchema;
  meta: IEnhancedJSONSchema;
}

export interface IPluginDefinition {
  name: string;
  opts?: IPluginOpts;
}

export interface IPluginOpts {
  runInTab?: boolean;
  lazyLoading?: boolean;
  [key: string]: any;
}

export abstract class BasePlugin {
  opts: IPluginOpts;

  constructor(opts = {}) {
    this.opts = SchemaHelper.instantiate(this.getOptsSchema(), opts);
  }

  abstract getMetaSchema(): IEnhancedJSONSchema;
  abstract getOptsSchema(): IEnhancedJSONSchema;

  abstract test(resource: IResource): boolean;
  abstract apply(site: ISite, resource: IResource): any;
}