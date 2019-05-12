import { Record } from 'immutable';
import PluginDefinition from './PluginDefinition';

interface ICrawlOptions {
  delay: number;
  maxResources: number;
}

interface IResourceFilterOptions {
  maxEntries: number;
  probability: number;
}

interface ISiteOptions {
  crawl: ICrawlOptions;
  resourceFilter: IResourceFilterOptions;
}

interface ISiteProps {
  id: string;
  name: string;
  url: string;
  pluginDefinitions: PluginDefinition[];
  opts: ISiteOptions;
}

const defaultSiteProps: ISiteProps = {
  id: null,
  name: null,
  url: null,
  pluginDefinitions: [],
  opts: {
    crawl: {
      delay: 200,
      maxResources: -1,
    },
    resourceFilter: {
      maxEntries: 5000,
      probability: 0.01,
    },
  },
};

export default class Site extends Record(defaultSiteProps) implements ISiteProps {
  public readonly id: string;
  public readonly name: string;
  public readonly url: string;

  public constructor(values?: Partial<ISiteProps>) {
    super(values || {});
  }
}
