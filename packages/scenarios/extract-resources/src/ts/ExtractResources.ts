import * as ConfigFormSchema from '../resources/config-form-schema.json';
import * as ConfigFormDefaults from '../resources/config-form-defaults.json';
import ScenarioConfigForm from './ScenarioConfigForm.js';

export default class ExtractResources extends ScenarioConfigForm {
  get CONFIG_FORM_SCHEMA() {
    return ConfigFormSchema;
  }

  get CONFIG_FORM_DEFAULTS() {
    return ConfigFormDefaults;
  }

  configSaveHandler(data) {
    console.log('extract-resources: configSaveHandler invoked');
  }
}