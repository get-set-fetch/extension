import { IPluginDefinition } from "./plugin";

export interface ISite {
  id: number;
  projectId: number;
  name: string;
  url: string;
  tabId: any;

  pluginDefinitions: IPluginDefinition[];
  plugins: any;

  crawlOpts: {
    maxResources: number,
    delay: number
  },

  storageOpts: {
    resourceFilter: {
      maxEntries: number,
      probability: number
    }
  }
}