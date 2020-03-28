import { IScenario, ExportType, IExportOpt } from 'get-set-fetch-extension-commons';

import DynamicNavigationPlugin from './plugins/DynamicNavigationPlugin';

export default class ExtractDynamicContent implements IScenario {
  getPluginNames() {
    return [
      'SelectResourcePlugin',
      'FetchPlugin',
      'DynamicNavigationPlugin',
      'ExtractHtmlContentPlugin',
      'InsertResourcesPlugin',
      'UpsertResourcePlugin',
    ];
  }

  getResultTableHeaders() {
    return [
      {
        label: 'Html Content',
        render: row => JSON.stringify(row.content),
      },
      {
        label: 'URL',
        render: row => (row.url),
      },
    ];
  }

  getResultExportOpts(): IExportOpt[] {
    return [
      {
        type: ExportType.CSV,
        cols: [ 'url', 'content' ],
        fieldSeparator: ',',
        lineSeparator: '\n',
      },
      {
        type: ExportType.ZIP,
        cols: [ 'blob' ],
      },
    ];
  }
}

export const embeddedPlugins = {
  DynamicNavigationPlugin,
};
