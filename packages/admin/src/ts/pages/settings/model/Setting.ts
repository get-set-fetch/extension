import { Record } from "immutable";

interface SettingProps {
  id: string;
  key: string;
  val: string;
}

const defaultSettingProps: SettingProps = {
  id: null,
  key: null,
  val: null
}

export default class Setting extends Record(defaultSettingProps) implements SettingProps {
  public readonly id: string;
  public readonly key: string;
  public readonly val: string;

  public constructor(values?: Partial<SettingProps>) {
    values ? super(values) : super()
  }
}
