import { IScenario, ExportType, IExportOpt } from 'get-set-fetch-extension-commons';

import ExtractHtmlContentPlugin from './plugins/ExtractHtmlContentPlugin';

export default class ExtractHtmlContent implements IScenario {
  getPluginNames() {
    return [
      'SelectResourcePlugin',
      'FetchPlugin',
      'ExtractUrlsPlugin',
      'ExtractHtmlContentPlugin',
      'ScrollPlugin',
      'UpdateResourcePlugin',
      'InsertResourcesPlugin',
    ];
  }

  getResultTableHeaders() {
    return [
      {
        label: 'Html Content',
        render: row => (row.info ? JSON.stringify(row.info.content) : ''),
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
        cols: [ 'url', 'info.content' ],
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
  ExtractHtmlContentPlugin,
};
