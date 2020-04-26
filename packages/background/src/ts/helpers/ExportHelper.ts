import JSZip from 'jszip/dist/jszip';
import { IExportOpt, IExportResult, ExportType, IResource, ILog, LogLevel } from 'get-set-fetch-extension-commons';

export default class ExportHelper {
  static exportResources(resources: IResource[], opts: IExportOpt): Promise<IExportResult> {
    if (resources.length === 0) throw new Error('Nothing to export. No resources crawled or with valid content.');

    switch (opts.type) {
      case ExportType.ZIP:
        return ExportHelper.exportResourcesZIP(resources, opts);
      case ExportType.CSV:
        return ExportHelper.exportResourcesCSV(resources, opts);
      default:
        throw new Error(`Invalid export type ${opts.type}.`);
    }
  }

  static async exportResourcesZIP(resources: IResource[], opts: IExportOpt): Promise<IExportResult> {
    const blobCol: string = opts.cols && opts.cols.length === 1 ? opts.cols[0] : null;
    if (!blobCol) throw new Error('Expecting a single column for blob content.');

    const blobResources: IResource[] = resources.filter(resource => resource[blobCol]);
    if (blobResources.length === 0) throw new Error('No binary content to export.');

    const zip = new JSZip();
    resources.forEach(resource => {
      if (resource[blobCol]) {
        const name = resource.meta && resource.meta.name ? resource.meta.name : resource.url.substr(-10);
        zip.file(name, resource[blobCol]);
      }
    });

    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'STORE',
    });

    return { url: URL.createObjectURL(content) };
  }

  static getRowDetailCols(row: object, props: string[]): string[] {
    return props.reduce(
      (detailCols, rootKey) => {
        const val = ExportHelper.nestedGetIn(row, rootKey);

        // val is either null or literal
        if (val === null || val.constructor === String || val.constructor === Number || val.constructor === Boolean) {
          detailCols.push(rootKey);
          return detailCols;
        }

        // val is array, assume each arr element is literal, doesn't contain objects
        if (Array.isArray(val)) {
          detailCols.push(rootKey);
          return detailCols;
        }

        // val is object, each property may contain sub.objects
        if (val.constructor === Object) {
          const objProps = Object.keys(val).map(key => `${rootKey}.${key}`);
          const objCols = ExportHelper.getRowDetailCols(row, objProps);
          return detailCols.concat(objCols);
        }

        return detailCols;
      },
      [],
    );
  }

  static exportCsvArr(data: object[], opts: Partial<IExportOpt>) {
    if (!opts.cols || opts.cols.length === 0) throw new Error('Expecting at least one column for csv content.');

    /*
    get expanded cols
    if col points to a literal, expandedCols will resolve to col
    if col points to an array, expandedCols will resolve to col
    if col points to an object, expandedCols will resolve to col.propA, col.propB, ...

    assumptations:
      - array elements can only be literals
      - obj properties can be literals, array, sub.objects
    */
    const expandedColSet = new Set<string>();
    data.forEach(row => {
      const detailCols = ExportHelper.getRowDetailCols(row, opts.cols);
      const diffCols = detailCols.filter(col => !expandedColSet.has(col));
      if (diffCols.length > 0) {
        diffCols.forEach(diffCol => expandedColSet.add(diffCol));
      }
    });

    const expandedCols = Array.from(expandedColSet).sort((colA, colB) => {
      const colAIdx = opts.cols.findIndex(col => colA.indexOf(col) === 0);
      const colBIdx = opts.cols.findIndex(col => colB.indexOf(col) === 0);

      return (colAIdx === colBIdx) ? colA.localeCompare(colB) : colAIdx - colBIdx;
    });

    const header = expandedCols;

    // map each data row to one or multiple csv rows (in case of data[prop] array)
    const body = data.reduce<any[]>(
      (allCsvRows, dataRow) => {
        const csvArr = ExportHelper.expandDataRowIntoCsvRows(dataRow, expandedCols);
        return allCsvRows.concat(csvArr);
      },
      [],
    );
    // const content = `${csvHeader}${lineSeparator}${csvBody}`;
    return { header, body };
  }

  /*
  dataRow: {a: ['a1', 'a2'], b: ['b1', 'b2], c: 'c1}
  into csvRows:
  [
    ['a1', 'b1', c1],
    ['a2', 'b2', c1]
  ]
  */
  static expandDataRowIntoCsvRows(dataRow: object, cols: string[]) {
    let idxIncremented;
    let arrIdx = -1;
    const csvRows = [];

    do {
      idxIncremented = false;
      // eslint-disable-next-line no-loop-func
      const csvRow = cols.map(expandedCol => {
        let val = ExportHelper.nestedGetIn(dataRow, expandedCol);

        // arr handling
        if (Array.isArray(val)) {
          if (!idxIncremented && arrIdx < val.length - 1) {
            arrIdx += 1;
            idxIncremented = true;
          }

          val = val.length > arrIdx ? val[arrIdx] : val[val.length - 1];
        }

        /*
        quotes handling
        RFC-4180 "If double-quotes are used to enclose fields,
        then a double-quote appearing inside a field must be escaped by preceding it with another double quote."
        */
        if (val === undefined) {
          return '""';
        }
        const quotedVal = val && val.constructor === String ? val.replace(/"/g, '""') : val;
        return `"${quotedVal}"`;
      });

      // only add to csv rows if it's the 1st pass or there have been new arr elements added
      if (arrIdx === -1 || idxIncremented) {
        csvRows.push(csvRow);
      }
    }
    while (idxIncremented);

    return csvRows;
  }

  static async exportResourcesCSV(resources: IResource[], opts: IExportOpt): Promise<IExportResult> {
    if (resources.length === 0) throw new Error('Nothing to export. No resources found.');
    if (!opts.cols || opts.cols.length === 0) throw new Error('Expecting at least one column for csv content.');

    try {
      const content = ExportHelper.exportCsvContent(resources, opts);
      const contentBlob = new Blob([ content ], { type: 'text/csv' });
      return { url: URL.createObjectURL(contentBlob) };
    }
    catch (error) {
      return { error };
    }
  }

  static exportCsvContent(resources: object[], opts: IExportOpt) {
    const fieldSeparator = opts.fieldSeparator ? opts.fieldSeparator : ',';
    const lineSeparator = opts.lineSeparator ? opts.lineSeparator : '\n';

    const { header, body } = ExportHelper.exportCsvArr(resources, opts);
    const csvHeader = header.join(fieldSeparator);
    const csvBody = body.map(row => row.join(fieldSeparator)).join(lineSeparator);

    return `${csvHeader}${lineSeparator}${csvBody}`;
  }

  static async exportLogs(logEntries: ILog[]): Promise<IExportResult> {
    if (logEntries.length === 0) throw new Error('Nothing to export. No log entries found.');

    const content = ExportHelper.exportLogContent(logEntries);
    const contentBlob = new Blob([ content ], { type: 'text/csv' });
    return { url: URL.createObjectURL(contentBlob) };
  }

  static exportLogContent(logEntries: ILog[]): string {
    const fieldSeparator = ', ';
    const lineSeparator = '\n';

    const content = logEntries
      .map(logEntry => {
        const { msg } = logEntry;
        const msgContent = msg.map(msg => JSON.stringify(msg)).join(' , ');

        const row = [ LogLevel[logEntry.level], new Date(logEntry.date).toISOString(), logEntry.cls, msgContent ];
        return row.join(fieldSeparator);
      })
      .join(lineSeparator);

    return content;
  }

  /*
    generally subobjects are detected by spliting the path against '.'
    but this is not always the case
    resource example:
    info: {
      content: {
        h1: '...'
        i.classA: [ ...]
      }
    }

    info.content.h1 exists
    info.content.i doesn't exists
    info.content.i.classA exists
    info.content.i.classA.0 exists
  */
  static nestedGetIn(nestedObj, path: string) {
    const pathSegments = path.split('.');

    let accPath: string[] = [];
    let accProp: string;

    const val = pathSegments.reduce(
      (obj, key) => {
        accPath.push(key);
        accProp = accPath.join('.');
        if (obj && Object.keys(obj).includes(accProp)) {
          accPath = [];
          return obj[accProp];
        }
        return obj;
      },
      nestedObj,
    );

    // if the accumulated path is not resolved till the end, the path is non-existent
    return accPath.length > 0 ? undefined : val;
  }
}
