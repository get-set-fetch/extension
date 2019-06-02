

declare module 'uniforms-bridge-json-schema' {
  import { JSONSchema7 } from "json-schema";

  export class JSONSchemaBridge {
    constructor(schema: JSONSchema7, validator: Function);

    getField(name: string): any;
  }
}
