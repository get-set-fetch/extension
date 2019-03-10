import { Record } from 'immutable';

interface IPluginDefinition {
  name: string;
}
interface IProjectProps {
  id: string;
  name: string;
  description: string;
  url: string;
  scenarioId: string;
  scenarioProps: object;
  pluginDefinitions: IPluginDefinition[];
}

const defaultProjectProps: IProjectProps = {
  id: null,
  name: null,
  description: null,
  url: null,
  scenarioId: null,
  scenarioProps: {},
  pluginDefinitions: []
};

export default class Project extends Record(defaultProjectProps) implements IProjectProps {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly scenarioId: string;
  readonly scenarioProps: object;

  constructor(values?: Partial<IProjectProps>) {
    values ? super(values) : super();
  }
}