import { IPluginDefinition } from "./plugin";

export interface ISite {
  id: number;
  projectId: number;
  name: string;
  url: string;
  tabId: any;

  plugins: IPluginDefinition[];
  pluginInstances: any;

  storageOpts: {
    resourceFilter: {
      maxEntries: number,
      probability: number
    }
  }
}