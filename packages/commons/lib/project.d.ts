import { IPluginDefinition } from './plugin';

interface IProjectCrawlOpts {
  maxDepth?: number;
  maxResources?: number;
  crawlDelay?: number;
}

interface IProjectStorage {
  id: number;
  name: string;
  description: string;
  url: string;
  crawlOpts:  IProjectCrawlOpts;
  scenarioId: number;
  scenarioProps: object;
  pluginDefinitions: IPluginDefinition[];
}
