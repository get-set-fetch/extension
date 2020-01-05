import { IResource } from './resource';
import { ISite } from './site';

export interface IPluginStorage {
  id: number;
  scenarioId?: number;
  name: string;
  code: string;
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

export interface IPlugin {
  opts?: IPluginOpts;
  test(resource: IResource): boolean;
  apply(site: ISite, resource: IResource): any;
}