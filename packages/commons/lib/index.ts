import SchemaHelper from './schema/SchemaHelper';
import { BasePlugin } from './plugin';

export {
  SchemaHelper,
  BasePlugin,
};

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

export enum ExportType {
  CSV = 'csv',
  ZIP = 'zip'
}

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}
