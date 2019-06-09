import JSZip from 'jszip/dist/jszip';
import { IExportOpt, IExportResult, ExportType, IResource, ILog, LogLevel } from 'get-set-fetch-extension-commons';

export default class ExportHelper {
  static exportResources(resources: IResource[], opts: IExportOpt): Promise<IExportResult> {
    if (resources.length === 0) throw new Error('Nothing to export. No resources crawled or with valid content');

    switch (opts.type) {
      case ExportType.ZIP:
        return ExportHelper.exportResourcesZIP(resources, opts);
      case ExportType.CSV:
        return ExportHelper.exportResourcesCSV(resources, opts);
      default:
        throw new Error(`Invalid export type ${opts}.type`);
    }
  }

  static exportResourcesZIP(resources: IResource[], opts: IExportOpt): Promise<IExportResult> {
    return new Promise(async resolve => {
      const blobCol: string = opts.cols && opts.cols.length === 1 ? opts.cols[0] : null;
      if (!blobCol) throw new Error('Expecting a single column for blob content');

      const zip = new JSZip();
      resources.forEach(resource => {
        if (resource[blobCol]) {
          const name = resource.info && resource.info.name ? resource.info.name : resource.url.substr(-10);
          zip.file(name, resource[blobCol]);
        }
      });

      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE',
      });

      resolve({ url: URL.createObjectURL(content) });
    });
  }

  static exportResourcesCSV(resources: IResource[], opts: IExportOpt): Promise<IExportResult> {
    return new Promise(async resolve => {
      const csvCols: string[] = opts.cols;
      if (!csvCols || csvCols.length === 0) throw new Error('Expecting at least one column for csv content');

      const fieldSeparator = opts.fieldSeparator ? opts.fieldSeparator : ',';
      const lineSeparator = opts.lineSeparator ? opts.lineSeparator : '\n';

      const header = csvCols.join(fieldSeparator);
      const body = resources
        .map(resource => {
          const row = csvCols.reduce(
            (result: string[], key) => {
              const propPath = key.split('.');
              const val = ExportHelper.getIn(resource, propPath);
              result.push(JSON.stringify(val || ''));
              return result;
            },
            [],
          );
          return row.join(fieldSeparator);
        })
        .join(lineSeparator);

      const content = `${header}${lineSeparator}${body}`;
      const contentBlob = new Blob([ content ], { type: 'text/csv' });

      resolve({ url: URL.createObjectURL(contentBlob) });
    });
  }

  static exportLogs(logEntries: ILog[]): Promise<IExportResult> {
    if (logEntries.length === 0) throw new Error('Nothing to export. No log entries found.');

    return new Promise(async resolve => {
      const csvCols = [ 'level', 'date', 'class', 'msg' ];
      const fieldSeparator = ', ';
      const lineSeparator = '\n';

      const header = csvCols.join(fieldSeparator);
      const body = logEntries
        .map(logEntry => {
          const { msg } = logEntry;
          const msgContent = msg.map(msg => JSON.stringify(msg)).join(' , ');
          const row = [ LogLevel[logEntry.level], logEntry.date, logEntry.cls, msgContent ];
          return row.join(fieldSeparator);
        })
        .join(lineSeparator);

      const content = `${header}${lineSeparator}${body}`;
      const contentBlob = new Blob([ content ], { type: 'text/csv' });

      resolve({ url: URL.createObjectURL(contentBlob) });
    });
  }

  static getIn(nestedObj, path) {
    return path.reduce(
      (obj, key) => ((obj && obj[key] !== 'undefined') ? obj[key] : undefined), nestedObj,
    );
  }
}
