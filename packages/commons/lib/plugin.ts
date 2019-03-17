import { IResource } from './resource';
import { ISite } from './site';

export interface IPluginDefinition {
  name: string;
  opts?: object;
}

export interface IPlugin {
  test(resource: IResource): boolean;
  apply(site: ISite, resource: IResource): any;
}