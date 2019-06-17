import { Record } from 'immutable';
import { IProjectStorage, IProjectCrawlOpts } from 'get-set-fetch-extension-commons';
import { IProjectScenarioOpts } from 'get-set-fetch-extension-commons/lib/project';

const defaultProjectProps: IProjectStorage = {
  id: null,
  name: null,
  description: '',
  url: null,
  crawlOpts: {
    maxDepth: -1,
    maxResources: 100,
    crawlDelay: 1000,
    pathnameRe: null,
  },
  scenarioOpts: {},
  pluginDefinitions: [],
};

export default class Project extends Record(defaultProjectProps) implements IProjectStorage {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly crawlOpts: IProjectCrawlOpts;
  readonly scenarioOpts: IProjectScenarioOpts;

  constructor(values?: Partial<IProjectStorage>) {
    super(values || {});
  }
}
