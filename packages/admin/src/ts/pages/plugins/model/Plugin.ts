import { Record } from 'immutable';
import { IModuleDefinition, IPluginStorage } from 'get-set-fetch-extension-commons';

const defaultPluginProps: IPluginStorage = {
  id: null,
  name: null,
  code: null,
};

export default class Plugin extends Record(defaultPluginProps) implements IModuleDefinition {
  readonly id: number;
  readonly name: string;
  readonly code: string;

  constructor(values?: Partial<IModuleDefinition>) {
    values ? super(values) : super();
  }
}