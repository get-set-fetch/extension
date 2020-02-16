import { IScenario, ExportType, IExportOpt } from 'get-set-fetch-extension-commons';

import ImageFilterPlugin from './plugins/ImageFilterPlugin';

export default class ExtractResources implements IScenario {
  getPluginNames() {
    return [
      'SelectResourcePlugin',
      'FetchPlugin',
      'ExtractUrlsPlugin',
      'ImageFilterPlugin',
      'ScrollPlugin',
      'UpdateResourcePlugin',
      'InsertResourcesPlugin',
    ];
  }

  getResultTableHeaders() {
    return [
      {
        label: 'Title',
        render: row => (row.info ? row.info.title : ''),
      },
      {
        label: 'Type',
        render: row => (row.mediaType),
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
        cols: [ 'url', 'mediaType' ],
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
  ImageFilterPlugin,
};
