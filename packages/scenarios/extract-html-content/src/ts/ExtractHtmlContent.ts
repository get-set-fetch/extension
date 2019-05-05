import { IScenario, ExportType, IExportOpt, IPluginDefinition, IPlugin, IModuleDefinition } from 'get-set-fetch-extension-commons';

import ConfigFormSchema from '../resources/config-form-schema';
import ConfigFormUISchema from '../resources/config-form-ui-schema';
import ExtractHtmlContentPlugin from './plugins/ExtractHtmlContentPlugin';

export default class ExtractHtmlContent implements IScenario {
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
        name: 'ExtractUrlPlugin',
        opts: {
          maxDepth: scenarioProps.maxDepth
        }
      },
      {
        name: 'ExtractHtmlContentPlugin',
        opts: {
          selectors: scenarioProps.selectors
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
        label: 'Html Content',
        render: (row) => (row.info ? JSON.stringify(row.info.content): '')
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
        cols: ['url', 'info.content'],
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
  ExtractHtmlContentPlugin
};