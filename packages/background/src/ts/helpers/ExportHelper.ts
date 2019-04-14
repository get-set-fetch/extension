import JSZip from 'jszip/dist/jszip';
import { IExportOpt, IExportResult, ExportType, IResource } from 'get-set-fetch-extension-commons';

export default class ExportHelper {
  static export(resources: IResource[], opts: IExportOpt): Promise<IExportResult> {

    if (resources.length === 0) throw new Error('Nothing to export. No resources crawled or with valid content');

    switch (opts.type) {
      case ExportType.ZIP:
        return ExportHelper.exportZIP(resources, opts);
      case ExportType.CSV:
        return ExportHelper.exportCSV(resources, opts);
    }
  }

  static exportZIP(resources: IResource[], opts: IExportOpt): Promise<IExportResult> {
    return new Promise(async (resolve) => {
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
        type:'blob',
        compression: 'STORE'
      });

      resolve({ url: URL.createObjectURL(content) });
    });
  }

  static exportCSV(resources: IResource[], opts: IExportOpt): Promise<IExportResult> {
    return new Promise(async (resolve) => {
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
              result.push(JSON.stringify(val ? val.toString() : ''));
              return result;
            },
            []
          );
          return row.join(fieldSeparator);
        })
        .join(lineSeparator);

      const content = `${header}${lineSeparator}${body}`;
      const contentBlob = new Blob([content], { type: 'text/csv' });

      resolve({ url: URL.createObjectURL(contentBlob) });
    });
  }

  static getIn(nestedObj, path) {
    return path.reduce(
      (obj, key) =>
      (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj
    );
  }
}