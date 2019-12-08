/* eslint-disable no-shadow */
import { JSONSchemaBridge } from 'uniforms-bridge-json-schema';

export default class GsfBridge extends JSONSchemaBridge {
  // eslint-disable-next-line no-useless-constructor
  constructor(schema, validator) {
    super(schema, validator);
  }

  getField(name) {
    const fieldDef = super.getField(name);
    fieldDef.uniforms = fieldDef.uniforms || {};
    fieldDef.uniforms.help = fieldDef.uniforms.help || fieldDef.description;
    fieldDef.uniforms = Object.assign(fieldDef.uniforms, fieldDef.ui);
    fieldDef.uniforms.labelClassName = 'col-form-label';
    fieldDef.uniforms.grid = 2;
    return fieldDef;
  }

  getError(name, errors) {
    const error = errors && errors.details ? errors.details.find(error => error.field === `data.${name}`) : null;
    return error;
  }

  getErrorMessage(name, errors) {
    const error = errors && errors.details ? errors.details.find(error => error.field === `data.${name}`) : null;
    return error ? error.message : null;
  }
}
