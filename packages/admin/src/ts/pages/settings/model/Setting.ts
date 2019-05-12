import { Record } from 'immutable';

interface ISettingProps {
  id: string;
  key: string;
  val: string;
}

const defaultSettingProps: ISettingProps = {
  id: null,
  key: null,
  val: null,
};

export default class Setting extends Record(defaultSettingProps) implements ISettingProps {
  public readonly id: string;
  public readonly key: string;
  public readonly val: string;

  public constructor(values?: Partial<ISettingProps>) {
    super(values || {});
  }
}
