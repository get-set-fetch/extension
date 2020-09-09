/* eslint-disable no-useless-escape */
import { assert, expect } from 'chai';
import { IResource, ExportType, ILog, LogLevel } from 'get-set-fetch-extension-commons';
import ExportHelper from '../../src/ts/helpers/ExportHelper';

describe('Test ExportHelper', () => {
  const lineSeparator = '\n';
  const fieldSeparator = ',';

  it('no html resources to export', async () => {
    const resources: Partial<IResource>[] = [
      { url: 'urlC', mediaType: 'image/png', content: {} },
    ];

    let thrownErr;

    try {
      await ExportHelper.exportResourcesCSV(
        resources as any,
        {
          type: ExportType.CSV,
          cols: [ 'url', 'content' ],
          fieldSeparator,
          lineSeparator,
        },
      );
    }
    catch (err) {
      thrownErr = err;
    }

    assert.strictEqual(thrownErr.message, 'No html content to export.');
  });

  it('no binary resources to export', async () => {
    const resources: Partial<IResource>[] = [
      { url: 'urlC', mediaType: 'image/png', content: {} },
    ];

    let thrownErr;

    try {
      await ExportHelper.exportResourcesZIP(
        resources as any,
        {
          type: ExportType.CSV,
          cols: [ 'blob' ],
          fieldSeparator,
          lineSeparator,
        },
      );
    }
    catch (err) {
      thrownErr = err;
    }

    assert.strictEqual(thrownErr.message, 'No binary content to export.');
  });

  it('export resources as csv, literal values', async () => {
    const resources: Partial<IResource>[] = [
      { url: 'urlA', mediaType: 'text/html', content: 'A "content"' },
      { url: 'urlB', mediaType: 'text/html', content: 'B " content' },
    ];

    const generatedLines: string[] = ExportHelper.exportCsvContent(
      resources,
      {
        type: ExportType.CSV,
        cols: [ 'url', 'content' ],
        fieldSeparator,
        lineSeparator,
      },
    ).split(lineSeparator).map(csvLine => csvLine.trim());

    const expectedLines = `url,content
      "urlA","A ""content"""
      "urlB","B "" content"`.split(lineSeparator).map(csvLine => csvLine.trim());

    assert.sameDeepOrderedMembers(expectedLines, generatedLines);
  });

  it('export resources as csv, array values', async () => {
    const resources: Partial<IResource>[] = [
      { url: 'urlA', mediaType: 'text/html', content: [ 'A1 content', 'A2 content' ] },
      { url: 'urlB', mediaType: 'text/html', content: [ 'B content' ] },
    ];

    const generatedLines: string[] = ExportHelper.exportCsvContent(
      resources,
      {
        type: ExportType.CSV,
        cols: [ 'url', 'content' ],
        fieldSeparator,
        lineSeparator,
      },
    ).split(lineSeparator).map(csvLine => csvLine.trim());

    const expectedLines = `url,content
      "urlA","A1 content"
      "urlA","A2 content"
      "urlB","B content"`.split(lineSeparator).map(csvLine => csvLine.trim());

    assert.sameDeepOrderedMembers(expectedLines, generatedLines);
  });

  it('export resources as csv, nested obj values', async () => {
    const resources: Partial<IResource>[] = [
      { url: 'urlA', mediaType: 'text/html', content: { arr: [ 'A-arr1', 'A-arr2' ], propB: 'A-propB' } },
      { url: 'urlB', mediaType: 'text/html', content: { arr: [ 'B-arr1' ], propC: 'B-propC' } },
      { url: 'urlC', mediaType: 'text/html', content: { arr: [ 'C-arr1', 'C-arr2', 'C-arr3' ], propC: 'C-propC' } },
    ];

    const generatedLines: string[] = ExportHelper.exportCsvContent(
      resources,
      {
        type: ExportType.CSV,
        cols: [ 'url', 'content' ],
        fieldSeparator,
        lineSeparator,
      },
    ).split(lineSeparator).map(csvLine => csvLine.trim());

    const expectedLines = `url,content.arr,content.propB,content.propC
    "urlA","A-arr1","A-propB",""
    "urlA","A-arr2","A-propB",""
    "urlB","B-arr1","","B-propC"
    "urlC","C-arr1","","C-propC"
    "urlC","C-arr2","","C-propC"
    "urlC","C-arr3","","C-propC"`.split(lineSeparator).map(csvLine => csvLine.trim());

    assert.sameDeepOrderedMembers(expectedLines, generatedLines);
  });

  it('export logs as csvs', async () => {
    const dateA = new Date(1000);
    const dateB = new Date(10000);
    const logs: ILog[] = [
      { id: 1, level: LogLevel.INFO, date: dateA, cls: 'ClassA', msg: [ 'msgA1' ] },
      { id: 2, level: LogLevel.ERROR, date: dateB, cls: 'ClassA', msg: [ 'msgB2', 'msgB2' ] },
    ];

    const generatedLines: string[] = ExportHelper.exportLogContent(logs).split(lineSeparator).map(csvLine => csvLine.trim());

    const expectedLines = `INFO, 1970-01-01T00:00:01.000Z, ClassA, "msgA1"
      ERROR, 1970-01-01T00:00:10.000Z, ClassA, "msgB2" , "msgB2"`.split(lineSeparator).map(csvLine => csvLine.trim());

    assert.sameDeepOrderedMembers(expectedLines, generatedLines);
  });

  it('get resource extension based on mime type', () => {
    const extension = ExportHelper.getExtension({ url: 'sitea.com/imgA.png', mediaType: 'image/png' });
    assert.strictEqual(extension, 'png');
  });

  it('get resource extension based on regex', () => {
    const extensionA = ExportHelper.getExtension({ url: 'sitea.com/imgA.pnga', mediaType: 'unknown' });
    assert.strictEqual(extensionA, 'pnga');

    const extensionB = ExportHelper.getExtension({ url: 'sitea.com/imgA.pnga?someVal=1', mediaType: 'unknown' });
    assert.strictEqual(extensionB, 'pnga');

    const extensionC = ExportHelper.getExtension({ url: 'sitea.com/imgA', mediaType: 'unknown' });
    assert.strictEqual(extensionC, 'unknown');
  });

  it('get resource name based on url regex', () => {
    const nameA = ExportHelper.getName({ url: 'sitea.com/imgA.png' });
    assert.strictEqual(nameA, 'imgA');

    const nameB = ExportHelper.getName({ url: 'sitea.com/imgA.png?someVal=1' });
    assert.strictEqual(nameB, 'imgA');

    const nameC = ExportHelper.getName({ url: 'sitea.com/imgA' });
    assert.strictEqual(nameC, 'imgA');
  });

  it('get resource name based on parent metadata', () => {
    const nameA = ExportHelper.getName({ url: 'sitea.com/imgA.png', parent: { title: 'titleA', imgAlt: 'img A' } });
    assert.strictEqual(nameA, 'titleA-img A');

    const nameB = ExportHelper.getName({ url: 'sitea.com/fileB.pdf', parent: { title: 'titleB', linkText: 'file B' } });
    assert.strictEqual(nameB, 'titleB-file B');
  });
});
