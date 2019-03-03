import { JSONSchema6 } from "json-schema";
import PluginDefinition from "../../sites/model/PluginDefinition";
import { IHeaderCol } from "../../../components/Table";

interface ResultExportOpt {
  type: 'csv'|'zip';
  cols: string[];
}

export default interface ScenarioInstance {
  id?: string;
  getConfigFormSchema: () => {default: object};
  getConfigFormUISchema: () => {default: object};
  getPluginDefinitions: (data:any) => {default: PluginDefinition[]};
  getResultTableHeaders(): IHeaderCol[];
  getResultExportOpts(): ResultExportOpt[];
}

export interface EnhancedJSONSchema extends JSONSchema6 {
  properties?: {
    [k: string]: EnhancedJSONSchema;
  }
  enumNames?: string[];
}