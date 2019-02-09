import { Record } from "immutable";

interface IPluginDefinition {
  name: string;
}
interface IProjectProps {
  id: string;
  name: string;
  description: string;
  url: string;
  scenarioId: string;
  scenarioProps:object;
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
}

export default class Project extends Record(defaultProjectProps) implements IProjectProps {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly url: string;
  public readonly scenarioId: string;
  public readonly scenarioProps: object;

  public constructor(values?: Partial<IProjectProps>) {
    values ? super(values) : super()
  }
}