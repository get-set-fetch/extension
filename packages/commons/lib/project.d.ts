import { IPluginDefinition } from './plugin';
import { IEnhancedJSONSchema } from './scenario';

interface IProjectStorage {
  id?: number;
  name: string;
  description: string;
  url: string;
  scenario: string;
  plugins: IPluginDefinition[];
}

interface IProjectConfigHash {
  hash: string;
}
