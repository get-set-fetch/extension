import { JSONSchema6 } from 'json-schema';
import { ExportType, HttpMethod } from ".";

export {ExportType, HttpMethod};

export interface IScenarioInstance {
  id?: string;
  getConfigFormSchema: () => object;
  getConfigFormUISchema: () => object;
  getPluginDefinitions: (data:any) => IPluginDefinition[];
  getResultTableHeaders(): IHeaderCol[];
  getResultExportOpts(): IExportOpt[];
}

export class IPluginDefinition {
  public readonly name:string;
  public readonly opts?:object;
}

export interface IHeaderCol {
  label: string,
  render: (row) => any;
  renderLink?: boolean;
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