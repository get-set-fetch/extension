export interface IModuleDefinition {
  id?: number;
  name: string;
  code: string;
}

export interface IModuleInfo {
  code?: string;
  module: any;
  url: string;
}