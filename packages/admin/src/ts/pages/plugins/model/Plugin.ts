import { Record } from "immutable";

interface PluginProps {
  id: string;
  name: string;
  code: string;
}

const defaultPluginProps: PluginProps = {
  id: null,
  name: null,
  code: null
}

export default class Plugin extends Record(defaultPluginProps) implements PluginProps {
  public readonly id: string;
  public readonly name: string;
  public readonly code: string;

  public constructor(values?: Partial<PluginProps>) {
    values ? super(values) : super()
  }
}