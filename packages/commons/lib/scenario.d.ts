import { JSONSchema6 } from 'json-schema';
import { ExportType } from ".";
import { IHeaderCol } from "./table";
import { IPluginDefinition, BasePlugin } from './plugin';
import { IModuleStorage } from './storage';
import { NpmPackage } from './npm';

export interface IScenarioStorage extends IModuleStorage {
  package: NpmPackage;
}

export interface IScenarioLink {
  href: string,
  title: string
}

export interface IScenario {
  id?: string;
  getConfigFormSchema: () => IEnhancedJSONSchema;
  getPluginNames: () => string[];
  /*
  getEmbeddedPlugins: () => {
    [name: string]: typeof BasePlugin;
  };
  */
  getResultTableHeaders(): IHeaderCol[];
  getResultExportOpts(): IExportOpt[];
}

export interface IExportOpt {
  type: ExportType;
  cols: string[];
  fieldSeparator?: string;
  lineSeparator?:string;
}

export interface IExportResult {
  url?: string;
  error?: string;
}

export interface IEnhancedJSONSchema extends JSONSchema6 {
  properties?: {
    [k: string]: IEnhancedJSONSchema;
  };
  ui?: {
    enumNames?: string[];
  };
  subType?: string;
}