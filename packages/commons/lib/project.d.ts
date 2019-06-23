import { IPluginDefinition } from './plugin';

interface IProjectCrawlOpts {
  maxDepth?: number;
  maxResources?: number;
  delay?: number;
  hostnameRe?: string;
  pathnameRe?: string;
  resourceHostnameRe? : string;
  resourcePathnameRe?: string;
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
