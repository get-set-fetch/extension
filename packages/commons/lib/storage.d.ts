export interface IModuleStorage {
  id?: number;
  name: string;
  code: string;
  builtin: boolean;
}

export interface IModuleRuntime {
  code?: string;
  module: any;
  url: string;
}