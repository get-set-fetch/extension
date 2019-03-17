import { IPluginDefinition } from "./plugin";

export interface ISite {
  id: number;
  projectId: number;
  name: string;
  url: string;
  tabId: any;

  pluginDefinitions: IPluginDefinition[];
  plugins: any;

  opts: {
    crawl: {
      maxConnections: number,
      maxResources: number,
      delay: number
    },
    resourceFilter: {
      maxEntries: number,
      probability: number
    }
  };
}