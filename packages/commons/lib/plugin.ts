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
  opts?: object;
}

export interface IPlugin {
  test(resource: IResource): boolean;
  apply(site: ISite, resource: IResource): any;
}