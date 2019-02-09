import { JSONSchema6 } from "json-schema";
import PluginDefinition from "../../sites/model/PluginDefinition";

export default interface ScenarioInstance {
  id?: string;
  getConfigFormSchema: () => {default: object};
  getConfigFormUISchema: () => {default: object};
  getPluginDefinitions: (data:any) => {default: PluginDefinition[]};
}

export interface EnhancedJSONSchema extends JSONSchema6 {
  properties?: {
    [k: string]: EnhancedJSONSchema;
  }
  enumNames?: string[];
}