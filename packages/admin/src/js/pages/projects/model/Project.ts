import { Record } from "immutable";

interface ProjectProps {
  id: string;
  name: string;
  description: string;
  scenarioId: string;
}

const defaultProjectProps: ProjectProps = {
  id: null,
  name: null,
  description: null,
  scenarioId: null
}

export default class Plugin extends Record(defaultProjectProps) implements ProjectProps {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly scenarioId: string;

  public constructor(values?: Partial<ProjectProps>) {
    values ? super(values) : super()
  }
}