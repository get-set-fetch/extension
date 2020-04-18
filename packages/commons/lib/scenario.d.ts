import { JSONSchema7 } from 'json-schema';
import { ExportType } from ".";
import { IHeaderCol } from "./table";
import { IPluginDefinition, BasePlugin } from './plugin';
import { IModuleStorage } from './storage';
import { INpmPackage } from './npm';

export interface IScenarioStorage extends IModuleStorage {
  package: INpmPackage;
}

export interface IScenarioLink {
  href: string,
  title: string
}

export interface IScenario {
  id?: string;
  getPluginNames: () => string[];
  getResultTableHeaders(): IHeaderCol[];
  getResultExportOpts(): IExportOpt[];
}

export interface IExportOpt {
  type: ExportType;
  cols: string[];
  fieldSeparator?: string;
  lineSeparator?: string;
}

export interface IExportResult {
  url?: string;
  error?: string;
}

export interface IEnhancedJSONSchema extends JSONSchema7 {
  properties?: {
    [k: string]: IEnhancedJSONSchema;
  };
  required?: string[],
  ui?: {
    enumNames?: string[];
    customField?: string;
  };
}