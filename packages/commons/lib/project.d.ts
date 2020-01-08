import { IPluginDefinition } from './plugin';
import { IEnhancedJSONSchema } from './scenario';

interface IProjectScenarioOpts {
  name?: string;
  [key: string]: any;
}

interface IProjectStorage {
  id: number;
  name: string;
  description: string;
  url: string;
  scenarioOpts: IProjectScenarioOpts;
  pluginDefinitions: IPluginDefinition[];
}

interface IProjectConfigHash {
  hash: string;
}
