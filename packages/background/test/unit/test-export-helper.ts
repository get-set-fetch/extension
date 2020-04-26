/* eslint-disable no-useless-escape */
import { assert } from 'chai';
import { IResource, ExportType, ILog, LogLevel } from 'get-set-fetch-extension-commons';
import ExportHelper from '../../src/ts/helpers/ExportHelper';

describe('Test ExportHelper', () => {
  const lineSeparator = '\n';
  const fieldSeparator = ',';

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
});
