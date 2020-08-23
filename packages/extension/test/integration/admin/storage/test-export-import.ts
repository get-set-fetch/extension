/* eslint-disable no-param-reassign */
import { assert } from 'chai';
import { Page } from 'puppeteer';
import { resolve } from 'path';
import { LogLevel, ILog, IProjectStorage, IPluginDefinition } from 'get-set-fetch-extension-commons';
import { BrowserHelper, FileHelper, getBrowserHelper } from 'get-set-fetch-extension-test-utils';

describe('Storage', () => {
  let browserHelper: BrowserHelper;
  let page: Page;
  const targetDir = resolve(process.cwd(), 'test', 'tmp');

  before(async () => {
    browserHelper = getBrowserHelper();
    await browserHelper.launch();

    // cast related to https://github.com/Microsoft/TypeScript/issues/7576
    ({ page } = browserHelper as { page: Page });
  });

  beforeEach(async () => {
    await browserHelper.goto('/scenarios');
    await browserHelper.waitFor('table.table-main');
  });

  afterEach(async () => {
    // cleanup fs
    FileHelper.emptyDir(targetDir);
  });

  after(async () => {
    await browserHelper.close();
  });

  it('Populate > Export Logs > Clear > Import Logs > Clear', async function() {
    if (process.env.browser === 'firefox') return this.skip();

    // 1. Populate
    const logLevels = [ 3, 4 ];
    // eslint-disable-next-line no-restricted-syntax
    for (const logLevel of logLevels) {
      // eslint-disable-next-line
      await page.evaluate((logLevel, cls, msg) => GsfClient.log(logLevel, cls, msg), logLevel, `cls${logLevel}`, `${LogLevel[logLevel]} message`);
    }

    // 2. Export
    await browserHelper.goto('/settings');

    // check logs and initiate download
    const exportLink = 'a#export';
    await page.waitFor(exportLink);

    await page.click('#Logs');
    await page.click(exportLink);

    // wait a bit for file to be generated and saved
    await new Promise(res => setTimeout(res, 5000));

    // 3. Get expected values and clear
    const expectedLogs: ILog[] = await page.evaluate(() => GsfClient.fetch('GET', 'logs'));
    await page.evaluate(() => GsfClient.fetch('DELETE', 'logs'));

    // check entries have been deleted, p.no-entries only appears when store is empty
    await browserHelper.goto('/logs');
    await browserHelper.waitFor('p#no-entries');

    // 4. Import
    // open settings page
    await browserHelper.goto('/settings');

    // checkbox logs, upload data to be imported
    await page.click('#Logs');
    const [ fileChooser ] = await Promise.all([
      page.waitForFileChooser(),
      page.click('#importLabel'), // some button that triggers file selection
    ]);
    await fileChooser.accept([ resolve(targetDir, 'gsf-export.json') ]);

    // wait for file to be imported
    await browserHelper.waitFor('p#success', 5000);

    // compare logs
    const importedLogs: ILog[] = await page.evaluate(() => GsfClient.fetch('GET', 'logs'));
    assert.sameDeepMembers(importedLogs, expectedLogs);

    // 5. Clear
    await page.evaluate(() => GsfClient.fetch('DELETE', 'logs'));
  });

  it('Export Plugins > Clear > Import Plugins',  async function() {
    if (process.env.browser === 'firefox') return this.skip();

    // 1. Export
    await browserHelper.goto('/settings');

    // check plugins and initiate download
    const exportLink = 'a#export';
    await page.waitFor(exportLink);

    await page.click('#Plugins');
    await page.click(exportLink);

    // wait a bit for file to be generated and saved
    await new Promise(res => setTimeout(res, 5000));

    // 2. Get expected values and clear
    const expectedPlugins = await page.evaluate(() => GsfClient.fetch('GET', 'plugins'));
    const pluginIds = expectedPlugins.map(expectedPlugin => expectedPlugin.id);
    await page.evaluate(reqBody => GsfClient.fetch('DELETE', 'plugins', reqBody), { ids: pluginIds });

    // check entries have been deleted, p.no-entries only appears when store is empty
    await browserHelper.goto('/plugins');
    await browserHelper.waitFor('p#no-entries');

    // 3. Import
    // open settings page
    await browserHelper.goto('/settings');

    // checkbox plugins, upload data to be imported
    await page.click('#Plugins');
    const [ fileChooser ] = await Promise.all([
      page.waitForFileChooser(),
      page.click('#importLabel'), // some button that triggers file selection
    ]);
    await fileChooser.accept([ resolve(targetDir, 'gsf-export.json') ]);

    // wait for file to be imported
    await browserHelper.waitFor('p#success', 5000);

    // compare plugins
    const importedPlugins = await page.evaluate(() => GsfClient.fetch('GET', 'plugins'));

    assert.sameDeepMembers(importedPlugins, expectedPlugins);
  });

  it('Populate > Export Project/Site/Resources > Clear > Import Export Project/Site/Resources > Clear', async function() {
    if (process.env.browser === 'firefox') return this.skip();

    // 1. Populate
    const plugins: IPluginDefinition[] = [ 'SelectResourcePlugin', 'ExtractUrlsPlugin', 'InsertResourcesPlugin', 'UpsertResourcePlugin' ].map(
      name => ({ name }),
    );
    const project: Partial<IProjectStorage> = {
      name: 'projA',
      description: 'descrA',
      url: 'urlA',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins,
    };
    await page.evaluate(project => GsfClient.fetch('POST', 'project', project), project as any);

    // 2. Export
    await browserHelper.goto('/settings');

    // check logs and initiate download
    const exportLink = 'a#export';
    await page.waitFor(exportLink);

    await page.click('#Projects');
    await page.click('#Sites');
    await page.click('#Resources');
    await page.click(exportLink);

    // wait a bit for file to be generated and saved
    await new Promise(res => setTimeout(res, 5000));

    // 3. Get expected values and clear
    const expectedProjects = await page.evaluate(() => GsfClient.fetch('GET', 'projects'));
    const expectedSites = await page.evaluate(() => GsfClient.fetch('GET', 'sites'));
    const expectedResources = await page.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}`), expectedSites[0].id);

    const projectIds = expectedProjects.map(expectedProject => expectedProject.id);
    await page.evaluate(reqBody => GsfClient.fetch('DELETE', 'projects', reqBody), { ids: projectIds });

    // check entries have been deleted, p.no-entries only appears when store is empty
    await browserHelper.goto('/projects');
    await browserHelper.waitFor('p#no-entries');

    assert.isEmpty((await page.evaluate(() => GsfClient.fetch('GET', 'sites'))));

    // 4. Import
    // open settings page
    await browserHelper.goto('/settings');

    // checkbox logs, upload data to be imported
    await page.click('#Projects');
    await page.click('#Sites');
    await page.click('#Resources');

    const [ fileChooser ] = await Promise.all([
      page.waitForFileChooser(),
      page.click('#importLabel'), // some button that triggers file selection
    ]);
    await fileChooser.accept([ resolve(targetDir, 'gsf-export.json') ]);

    // wait for file to be imported
    await browserHelper.waitFor('p#success', 5000);

    // compare instances
    const importedProjects = await page.evaluate(() => GsfClient.fetch('GET', 'projects'));
    const importedSites = await page.evaluate(() => GsfClient.fetch('GET', 'sites'));
    const importedResources = await page.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}`), expectedSites[0].id);

    assert.sameDeepMembers(importedProjects, expectedProjects);
    assert.sameDeepMembers(importedSites, expectedSites);
    assert.sameDeepMembers(importedResources, expectedResources);

    // 5. Clear
    await page.evaluate(projectIds => GsfClient.fetch('DELETE', 'projects', { ids: projectIds }), projectIds);
  });
});
