import { readFileSync } from 'fs';
import { resolve } from 'path';
import JSZip from 'jszip/dist/jszip';
import BrowserHelper from './BrowserHelper';

export default class ProjectHelper {
  static async saveProject(browserHelper: BrowserHelper, project, scenarioProps: any) {
    const { page } = browserHelper;

    // get scenario id based on name
    const scenarios = await page.evaluate(() => GsfClient.fetch('GET', `scenarios`));
    const scenarioId = scenarios.find(scenario => scenario.name === scenarioProps.name).id;

    // go to project list
    await browserHelper.goto('/projects');

    // open project detail page
    await page.waitFor('#newproject');
    await page.click('#newproject');

    // wait for the project detail page to load, react-json-schema form has its own id generating policy appending 'root_" to 1st level schema properties
    await page.waitFor('input#root_name');

    // fill in text input data for the new project
    await page.type('input#root_name', project.name);
    await page.type('input#root_description', project.description);
    await page.type('input#root_url', project.url);

    if (project.crawlOpts && project.crawlOpts.maxDepth) {
      await page.evaluate( () => (document.getElementById('root_crawlOpts_maxDepth') as HTMLInputElement).value = '');
      await page.type('input#root_crawlOpts_maxDepth', project.crawlOpts.maxDepth.toString());
    }

    if (project.crawlOpts && project.crawlOpts.maxResources) {
      await page.evaluate( () => (document.getElementById('root_crawlOpts_maxResources') as HTMLInputElement).value = '');
      await page.type('input#root_crawlOpts_maxResources', project.crawlOpts.maxResources.toString());
    }

    if (project.crawlOpts && project.crawlOpts.crawlDelay) {
      await page.evaluate( () => (document.getElementById('root_crawlOpts_crawlDelay') as HTMLInputElement).value = '');
      await page.type('input#root_crawlOpts_crawlDelay', project.crawlOpts.crawlDelay.toString());
    }

    // fill in dropdown scenario
    await page.select('#root_scenarioId', scenarioId.toString());

    // fill in other scenario props
    const validPropKeys: string[] = Object.keys(scenarioProps).filter(propKey => propKey !== 'name');
    for (const propKey of validPropKeys) {
      const propSelector = `#root_scenarioProps_${propKey}`;
      await page.evaluate(
          (propSelector) => {
            const input: any = document.querySelector(propSelector);
            input.value = '';
          },
          propSelector
        );

      await page.type(propSelector, scenarioProps[propKey].toString());
    }

    // save the project
    await page.click('#save');

    // wait for project to be saved and project list to be available
    await page.waitFor('table.table-main');
  }

  static async downloadProjectCsv(page, project, targetDir) {
    // open export dropdown
    const downloadBtn = 'button#export';
    await page.waitFor(downloadBtn);
    await page.click(downloadBtn);

    // initiate download
    const csvLink = `a#csv-${ project.id }`;
    await page.waitFor(csvLink);
    await page.click(csvLink);

    // wait a bit for file to be generated and saved
    await new Promise(res => setTimeout(res, 1000));

    const generatedContent = readFileSync(resolve(targetDir, `${ project.name }.csv`), 'utf8');
    const csvLines = generatedContent.split('\n');

    const header = csvLines[0];
    const body = csvLines.slice(1);

    return {
      header, body
    };
  }

  static async downloadProjectZip(page, project, targetDir) {
    // open export dropdown
    const downloadBtn = 'button#export';
    await page.waitFor(downloadBtn);
    await page.click(downloadBtn);

    // initiate download
    const zipLink = `a#zip-${ project.id }`;
    await page.waitFor(zipLink);
    await page.click(zipLink);

    // wait a bit for file to be generated and saved
    await new Promise(res => setTimeout(res, 1000));

    const generatedContent = readFileSync(resolve(targetDir, `${ project.name }.zip`), 'binary');
    const archive = await JSZip.loadAsync(generatedContent);

    return Object.keys(archive.files).map(name => archive.files[name].name);
  }

}