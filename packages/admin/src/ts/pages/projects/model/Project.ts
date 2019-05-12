import { Record } from 'immutable';
import { IProjectStorage } from 'get-set-fetch-extension-commons';

const defaultProjectProps: IProjectStorage = {
  id: null,
  name: null,
  description: null,
  url: null,
  scenarioId: null,
  scenarioProps: {},
  pluginDefinitions: [],
};

export default class Project extends Record(defaultProjectProps) implements IProjectStorage {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly scenarioId: number;
  readonly scenarioProps;

  constructor(values?: Partial<IProjectStorage>) {
    super(values || {});
  }
}
