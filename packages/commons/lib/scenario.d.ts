import { JSONSchema6 } from 'json-schema';
import { ExportType } from ".";
import { IHeaderCol } from "./table";
import { IPluginDefinition, IPlugin } from './plugin';
import { IModuleDefinition } from './storage';
import { NpmPackage } from './npm';

interface IScenarioPackage {
  id?: number;
  name: string;
  package: NpmPackage;
  code: string;
  builtin: boolean;
}

export interface IScenarioLink {
  href: string,
  title: string
}

export interface IScenario {
  id?: string;
  getConfigFormSchema: () => object;
  getConfigFormUISchema: () => object;
  getPluginDefinitions: (data:any) => IPluginDefinition[];
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
  enumNames?: string[];
}