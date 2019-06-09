import { Record } from 'immutable';
import { ISetting } from 'get-set-fetch-extension-commons';

const defaultSettingProps: ISetting = {
  id: null,
  key: null,
  val: null,
};

export default class Setting extends Record(defaultSettingProps) implements ISetting {
  public readonly id: number;
  public readonly key: string;
  public readonly val;

  public constructor(values?: Partial<ISetting>) {
    super(values || {});
  }
}
