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
          const arrCols = val.map((entry, idx) => `${rootKey}.${idx}`);
          return detailCols.concat(arrCols);
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

  static exportCSV(data: object[], opts: IExportOpt): string {
    const rootCols: string[] = opts.cols;
    if (!rootCols || rootCols.length === 0) throw new Error('Expecting at least one column for csv content');

    const fieldSeparator = opts.fieldSeparator ? opts.fieldSeparator : ',';
    const lineSeparator = opts.lineSeparator ? opts.lineSeparator : '\n';

    /*
    get expanded cols
    if rootCol points to an array, expandedCols will resolve to rootCol.0, rootCol.1, ...
    if rootCol points to an object, expandedCols will resolve to rootCol.propA, rootCol.propB, ...
    if rootCol points to a literal, expandedCols will resolve to rootCol

    assumptations:
      - array elements can only be literals
      - obj properties can be literals, array, sub.objects
    */
    const globalCols = new Set<string>();
    data.forEach(row => {
      const detailCols = ExportHelper.getRowDetailCols(row, rootCols);
      const diffCols = detailCols.filter(col => !globalCols.has(col));
      if (diffCols.length > 0) {
        diffCols.forEach(diffCol => globalCols.add(diffCol));
      }
    });

    // order expanded globalCols based on rootCols
    const orderedGlobalCols = Array.from(globalCols).sort((colA, colB) => {
      const rootAIdx = rootCols.findIndex(rootCol => colA.indexOf(rootCol) === 0);
      const rootBIdx = rootCols.findIndex(rootCol => colB.indexOf(rootCol) === 0);

      return (rootAIdx === rootBIdx) ? colA.localeCompare(colB) : rootAIdx - rootBIdx;
    });
    const csvHeader = orderedGlobalCols.join(fieldSeparator);

    // TO DO: one time propPaths generation, skipping the rather complicated getIn logic
    // const propPaths = orderedGlobalCols.map(col => col.split('.'));

    // map each data row to the expanded globalCols
    const csvBody = data.map(
      dataRow => {
        const dataRowElms = orderedGlobalCols.reduce(
          (elms, orderedGlobalCol) => {
            const val = ExportHelper.nestedGetIn(dataRow, orderedGlobalCol);

            if (val === undefined) {
              elms.push('""');
            }
            else {
              /*
              RFC-4180 "If double-quotes are used to enclose fields,
              then a double-quote appearing inside a field must be escaped by preceding it with another double quote."
              */
              const quotedVal = val && val.constructor === String ? val.replace(/"/g, '""') : val;
              elms.push(`"${quotedVal}"`);
            }

            return elms;
          },
          [],
        );

        return dataRowElms.join(fieldSeparator);
      },
    ).join(lineSeparator);

    const content = `${csvHeader}${lineSeparator}${csvBody}`;
    return content;
  }


  static async exportResourcesCSV(resources: IResource[], opts: IExportOpt): Promise<IExportResult> {
    if (resources.length === 0) throw new Error('Nothing to export. No resources found.');

    const content = ExportHelper.exportCSV(resources, opts);
    const contentBlob = new Blob([ content ], { type: 'text/csv' });
    return { url: URL.createObjectURL(contentBlob) };
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

  static getIn2(nestedObj, path: string[]) {
    return path.reduce(
      (obj, key) => ((obj && obj[key] !== 'undefined') ? obj[key] : undefined), nestedObj,
    );
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
        if (Object.keys(obj).includes(accProp)) {
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
