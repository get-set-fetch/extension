import { ExportType, HttpMethod } from ".";

export {ExportType, HttpMethod};

export interface ScenarioInstance {
  id?: string;
  getConfigFormSchema: () => object;
  getConfigFormUISchema: () => object;
  getPluginDefinitions: (data:any) => PluginDefinition[];
  getResultTableHeaders(): IHeaderCol[];
  getResultExportOpts(): ResultExportOpt[];
}

export class PluginDefinition {
  public readonly name:string;
  public readonly opts?:object;
}

export interface IHeaderCol {
  label: string,
  render: (row) => any;
  renderLink?: boolean;
}


export interface ResultExportOpt {
  type: ExportType;
  cols: string[];
}