import { IScenario, ExportType, IExportOpt, IPluginDefinition, IPlugin, IModuleDefinition } from 'get-set-fetch-extension-commons';

import ConfigFormSchema from '../resources/config-form-schema';
import ConfigFormUISchema from '../resources/config-form-ui-schema';
import ImageFilterPlugin from './plugins/ImageFilterPlugin';

export default class ExtractResources implements IScenario {
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
        name: 'FetchPlugin'
      },
      {
        name: 'ExtractUrlsPlugin',
        opts: {
          extensionRe: scenarioProps.extensionRe,
          maxDepth: scenarioProps.maxDepth
        }
      },
      {
        name: 'ImageFilterPlugin'
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
        cols: ['url', 'mediaType'],
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

export const embeddedPlugins = {
  ImageFilterPlugin
};