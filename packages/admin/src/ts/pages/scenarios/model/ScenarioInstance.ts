import { JSONSchema6 } from "json-schema";
import PluginDefinition from "../../sites/model/PluginDefinition";

interface ResultColDefinition {
  label: string;
  render: (row:any) => any;
}

export default interface ScenarioInstance {
  id?: string;
  getConfigFormSchema: () => {default: object};
  getConfigFormUISchema: () => {default: object};
  getPluginDefinitions: (data:any) => {default: PluginDefinition[]};
  getResultDefinition(): ResultColDefinition[];
}

export interface EnhancedJSONSchema extends JSONSchema6 {
  properties?: {
    [k: string]: EnhancedJSONSchema;
  }
  enumNames?: string[];
}