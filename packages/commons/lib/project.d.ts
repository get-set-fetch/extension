import { IPluginDefinition } from './plugin';

interface IProjectCrawlOpts {
  maxDepth?: number;
  maxResources?: number;
  crawlDelay?: number;
}

interface IProjectScenarioOpts {
  scenarioId?: number;
}

interface IProjectStorage {
  id: number;
  name: string;
  description: string;
  url: string;
  crawlOpts:  IProjectCrawlOpts;
  scenarioOpts: IProjectScenarioOpts;
  pluginDefinitions: IPluginDefinition[];
}
