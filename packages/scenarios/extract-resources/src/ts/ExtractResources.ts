import { IScenarioInstance, ExportType, IExportOpt, IPluginDefinition } from 'get-set-fetch-extension-commons';

import ConfigFormSchema from '../resources/config-form-schema';
import ConfigFormUISchema from '../resources/config-form-ui-schema';

export default class ExtractResources implements IScenarioInstance {
  getConfigFormSchema() {
    return ConfigFormSchema;
  }

  getConfigFormUISchema() {
    return ConfigFormUISchema;
  }

  getPluginDefinitions(scenarioProps) {
    const pluginDefinitions: IPluginDefinition[] = [
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

  getResultTableHeaders() {
    return [
      {
        label: 'Title',
        render: (row) => (row.info ? row.info.title: '')
      },
      {
        label: 'Type',
        render: (row) => (row.mediaType)
      },
      {
        label: 'URL',
        render: (row) => (row.url)
      }
    ];
  }

  getResultExportOpts(): IExportOpt[] {
    return [
      {
        type: ExportType.CSV,
        cols: ['url', 'info.title', 'mediaType'],
        fieldSeparator: ',',
        lineSeparator: '\n'
      },
      {
        type: ExportType.ZIP,
        cols: ['blob']
      }
    ];
  }
}