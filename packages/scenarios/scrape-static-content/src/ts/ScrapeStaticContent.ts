import { IScenario, ExportType, IExportOpt } from 'get-set-fetch-extension-commons';

export default class ScrapeStaticContent implements IScenario {
  getPluginNames() {
    return [
      'SelectResourcePlugin',
      'FetchPlugin',
      'ScrollPlugin',
      'ExtractUrlsPlugin',
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
