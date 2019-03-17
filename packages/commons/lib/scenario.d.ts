import { JSONSchema6 } from 'json-schema';
import { ExportType } from ".";
import { IHeaderCol } from "./table";
import { IPluginDefinition } from './plugin';

export interface IScenarioDefinition {
  id: number;
  name: string;
  code: string;
}

export interface IScenarioLink {
  href: string,
  title: string
}

export interface IScenario {
  id?: string;
  getDescription: () => string;
  getLink: () => IScenarioLink;
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