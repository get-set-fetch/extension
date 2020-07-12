import { IPluginDefinition } from "./plugin";
import { IResource } from "./resource";

export interface ISite {
  id: number;
  projectId: number;
  name: string;
  url: string;
  crawlInProgress: boolean;
  tabId: any;

  resourceFilter: Buffer;

  plugins: IPluginDefinition[];
  pluginInstances: any;

  getResourceToCrawl: (frequency: number) => Promise<IResource>
}