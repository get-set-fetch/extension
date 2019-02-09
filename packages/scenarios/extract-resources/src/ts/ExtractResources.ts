import * as ConfigFormSchema from '../resources/config-form-schema.json';
import * as ConfigFormUISchema from '../resources/config-form-ui-schema.json';

import { ScenarioInstance } from 'get-set-fetch-extension-admin';

export default class ExtractResources implements ScenarioInstance {
  getConfigFormSchema() {
    return ConfigFormSchema;
  }

  getConfigFormUISchema() {
    return ConfigFormUISchema;
  }

  getPluginDefinitions(scenarioProps) {
    const pluginDefinitions = [
        {
          name: 'SelectResourcePlugin'
        },
        {
          name: 'ExtensionFetchPlugin'
        },
        {
          name: 'ExtractUrlPlugin'
        },
        {
          name: 'ExtractTitlePlugin',
          opts: {
            extensions: scenarioProps.extensions,
            maxDepth: scenarioProps.maxDepth
          }
        },
        {
          name: 'UpdateResourcePlugin'
        },
        {
          name: 'InsertResourcePlugin'
        }
      ];

    return pluginDefinitions;
  }
}