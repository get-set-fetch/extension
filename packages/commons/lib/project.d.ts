import { IPluginDefinition } from './plugin';

interface IProjectStorage {
  id: number;
  name: string;
  description: string;
  url: string;
  scenarioId: number;
  scenarioProps: object;
  pluginDefinitions: IPluginDefinition[];
}
