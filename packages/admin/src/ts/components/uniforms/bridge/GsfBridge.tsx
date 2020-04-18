/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
import { JSONSchemaBridge } from 'uniforms-bridge-json-schema';
import { IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';
import { getIn } from 'immutable';

export default class GsfBridge extends JSONSchemaBridge {
  /*
  plugin schemas can have the enabled (bool) property
  if !enabled, don't render the other props at the same level, remove them
  think of it as a poor man's substitute for conditional if from json schema v.7
  */
  static trimmDisabledProps(schema, data) {
    if (schema.properties && schema.properties.enabled && data.enabled !== true) {
      const { enabled } = schema.properties;
      schema.properties = {
        enabled,
      };
    }

    Object.keys(schema.properties).forEach(key => {
      const propSchema = schema.properties[key];
      if (propSchema.properties) {
        schema.properties[key] = GsfBridge.trimmDisabledProps(schema.properties[key], data[key] || {});
      }
    });

    return schema;
  }

  static getJsonPointer(fieldId: string) {
    return fieldId.split('.').reduce(
      (jsonPointer, subId) => (jsonPointer ? jsonPointer.concat(`.properties.${subId}`) : `properties.${subId}`),
      null,
    );
  }

  static getFieldType(fieldId: string, schema: IEnhancedJSONSchema) {
    const subSchema = getIn(schema, GsfBridge.getJsonPointer(fieldId).split('.'), {});
    return subSchema.type;
  }

  static castFieldValue(fieldId: string, val: any, schema: IEnhancedJSONSchema) {
    const fieldType = GsfBridge.getFieldType(fieldId, schema);
    switch (fieldType) {
      case 'number':
        return parseInt(val, 10);
      case 'boolean':
        return JSON.parse(val);
      default:
        return val;
    }
  }

  constructor(schema, data, validator) {
    super(GsfBridge.trimmDisabledProps(JSON.parse(JSON.stringify(schema)), data), validator);
  }

  getField(name) {
    const fieldDef = super.getField(name);
    fieldDef.uniforms = fieldDef.uniforms || {};

    if (fieldDef.ui) {
      fieldDef.uniforms = Object.assign(fieldDef.uniforms, fieldDef.ui);
      fieldDef.uniforms.customPlaceholder = fieldDef.ui.placeholder; // uniforms overrides "placeholder" prop at some point, use a custom one
      delete fieldDef.ui;
    }


    fieldDef.uniforms.help = fieldDef.uniforms.help || fieldDef.description;
    delete fieldDef.description;

    fieldDef.uniforms.labelClassName = 'col-form-label';
    fieldDef.uniforms.grid = 2;

    // numeric types can only be incremented with whole values, this is added to all fields, not good!!
    fieldDef.uniforms.step = 1;

    // fields defininig constants are read-only
    fieldDef.disabled = fieldDef.const !== undefined;

    return fieldDef;
  }

  getError(name, errors) {
    /*
    uniforms property accessor is done via .
    validation property accessor is done via [".."]
    ex: "plugins.Select Resource Plugin.frequency" vs data.plugins["Extract Urls Plugin"].frequency
    make sure the two match
    */
    const error = errors && errors.details
      ? errors.details.find(error => error.field.replace(/\["|"\]\./g, '.') === `data.${name}`)
      : null;

    return error;
  }

  getErrorMessage(name, errors) {
    const error = this.getError(name, errors);
    return error ? error.message : null;
  }
}
