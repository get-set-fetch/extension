import { readFileSync } from 'fs';
import { resolve } from 'path';
import JSZip from 'jszip/dist/jszip';
import BrowserHelper from './BrowserHelper';

declare const GsfClient;
export default class ProjectHelper {
  static async saveProject(browserHelper: BrowserHelper, project, scenarioOpts) {
    const { page } = browserHelper;

    // get scenario id based on name
    const scenarios = await page.evaluate(() => GsfClient.fetch('GET', 'scenarios'));
    const scenarioId = scenarios.find(scenario => scenario.name === scenarioOpts.name).id;

    // go to project list
    await browserHelper.goto('/projects');

    // open project detail page
    await page.waitFor('#newproject');
    await page.click('#newproject');

    // wait for the project detail page to load
    await page.waitFor('input#name');

    // fill in text input data for the new project
    await page.type('input#name', project.name);
    await page.type('input#description', project.description);
    await page.type('input#url', project.url);

    if (project.crawlOpts && project.crawlOpts.maxDepth !== undefined) {
      await page.evaluate(() => {
        (document.getElementById('crawlOpts.maxDepth') as HTMLInputElement).value = '';
      });
      await page.type('input[id="crawlOpts.maxDepth"]', project.crawlOpts.maxDepth.toString());
    }

    if (project.crawlOpts && project.crawlOpts.maxResources) {
      await page.evaluate(() => {
        (document.getElementById('crawlOpts.maxResources') as HTMLInputElement).value = '';
      });
      await page.type('input[id="crawlOpts.maxResources"]', project.crawlOpts.maxResources.toString());
    }

    if (project.crawlOpts && project.crawlOpts.delay) {
      await page.evaluate(() => {
        (document.getElementById('crawlOpts.delay') as HTMLInputElement).value = '';
      });
      await page.type('input[id="crawlOpts.delay"]', project.crawlOpts.delay.toString());
    }

    // fill in dropdown scenario
    await page.select('select[id="scenarioOpts.scenarioId"]', scenarioId.toString());

    // fill in other scenario props
    const validPropKeys: string[] = Object.keys(scenarioOpts).filter(propKey => propKey !== 'name');
    await Promise.all(
      validPropKeys.map(async propKey => {
        const propSelector = `[id="scenarioOpts.${propKey}"]`;
        await page.evaluate(
          propSelector => {
            const input = document.querySelector(propSelector);
            input.value = '';
          },
          propSelector,
        );

        await page.type(propSelector, scenarioOpts[propKey].toString());
      }),
    );

    // save the project
    await page.click('#save');

    // wait for project to be saved and project list to be available
    await page.waitFor('table.table-main');
  }

  static async downloadProjectCsv(page, project, targetDir, csvLineSeparator) {
    // open export dropdown
    const downloadBtn = 'button#export';
    await page.waitFor(downloadBtn);
    await page.click(downloadBtn);

    // initiate download
    const csvLink = `a#csv-${project.id}`;
    await page.waitFor(csvLink);
    await page.click(csvLink);

    // wait a bit for file to be generated and saved
    await new Promise(res => setTimeout(res, 1000));

    const generatedContent = readFileSync(resolve(targetDir, `${project.name}.csv`), 'utf8');
    const csvLines = generatedContent.split(csvLineSeparator);

    const header = csvLines[0];
    const body = csvLines.slice(1);

    return {
      header, body,
    };
  }

  static async downloadProjectZip(page, project, targetDir) {
    // open export dropdown
    const downloadBtn = 'button#export';
    await page.waitFor(downloadBtn);
    await page.click(downloadBtn);

    // initiate download
    const zipLink = `a#zip-${project.id}`;
    await page.waitFor(zipLink);
    await page.click(zipLink);

    // wait a bit for file to be generated and saved
    await new Promise(res => setTimeout(res, 1000));

    const generatedContent = readFileSync(resolve(targetDir, `${project.name}.zip`), 'binary');
    const archive = await JSZip.loadAsync(generatedContent);

    return Object.keys(archive.files).map(name => archive.files[name].name);
  }
}
