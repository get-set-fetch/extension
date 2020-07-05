/* eslint-disable no-param-reassign */
import { readFileSync } from 'fs';
import { assert } from 'chai';
import { Page } from 'puppeteer';
import { resolve } from 'path';
import { LogLevel } from 'get-set-fetch-extension-commons';
import { BrowserHelper } from 'get-set-fetch-extension-test-utils';


describe('Storage', () => {
  let browserHelper: BrowserHelper;
  let page: Page;
  const targetDir = resolve(process.cwd(), 'test', 'tmp');

  const expectedJsonContent = {
    Logs: [ {
      level: 3,
      cls: 'cls3',
      msg: [ 'WARN message' ],
    },
    {
      level: 4,
      cls: 'cls4',
      msg: [ 'ERROR message' ],
    },
    ],
  };

  before(async () => {
    const extensionPath = resolve(process.cwd(), 'node_modules', 'get-set-fetch-extension', 'dist');
    browserHelper = new BrowserHelper({ extension: { path: extensionPath } });
    await browserHelper.launch();
    // cast related to https://github.com/Microsoft/TypeScript/issues/7576
    ({ page } = browserHelper as { page: Page });
  });

  beforeEach(async () => {
    await browserHelper.goto('/scenarios');
    await browserHelper.waitFor('table.table-main');
  });

  afterEach(async () => {
    await page.evaluate(() => GsfClient.fetch('DELETE', 'logs'));
  });

  after(async () => {
    await browserHelper.close();
  });

  it('Populate > Export > Clear > Import Logs', async () => {
    // 1. Populate
    // do logging on WARN and higher, levels recorded by default settings
    const logLevels = [ 3, 4 ];
    // eslint-disable-next-line no-restricted-syntax
    for (const logLevel of logLevels) {
      // eslint-disable-next-line
      await page.evaluate((logLevel, cls, msg) => GsfClient.log(logLevel, cls, msg), logLevel, `cls${logLevel}`, `${LogLevel[logLevel]} message`);
    }

    // 2. Export
    // open settings page
    await browserHelper.goto('/settings');

    // check logs and initiate download
    const exportLink = 'a#export';
    await page.waitFor(exportLink);

    await page.click('#Logs');
    await page.click(exportLink);

    // wait a bit for file to be generated and saved
    await new Promise(res => setTimeout(res, 1000));

    // read content
    const rawContent = readFileSync(resolve(targetDir, 'gsf-export.json'), 'utf8');
    const jsonContent = JSON.parse(rawContent);

    jsonContent.Logs.forEach(logEntry => {
      delete logEntry.id;
      delete logEntry.date;
    });
    assert.deepEqual(jsonContent, expectedJsonContent);

    // 3. Clear
    await page.evaluate(() => GsfClient.fetch('DELETE', 'logs'));

    // check entries have been deleted, p.no-entries only appears when store is empty
    await browserHelper.goto('/logs');
    await browserHelper.waitFor('p#no-entries');

    // 4. Import
    // open settings page
    await browserHelper.goto('/settings');

    /*
    // upload data to be imported
    const [ fileChooser ] = await Promise.all([
      page.waitForFileChooser(),
      page.click('#importLabel'), // some button that triggers file selection
    ]);
    await fileChooser.accept([ resolve(targetDir, 'gsf-export.json') ]);

    // compare logs
    const importedLogs = await page.evaluate(() => GsfClient.fetch('GET', 'logs'));
    importedLogs.Logs.forEach(logEntry => {
      delete logEntry.id;
      delete logEntry.date;
    });
    assert.deepEqual(importedLogs, expectedJsonContent.Logs);
    */
  });
});
