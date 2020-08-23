import { readFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import JSZip from 'jszip/dist/jszip';
import { IProjectStorage, IPluginDefinition } from 'get-set-fetch-extension-commons';
import BrowserHelper from './browser/BrowserHelper';

declare const GsfClient;
export default class ProjectHelper {
  static async saveProject(browserHelper: BrowserHelper, project: IProjectStorage) {
    const { page } = browserHelper;

    // go to project list
    await browserHelper.goto('/projects');

    // if project already exists edit it, otherwise create a new one
    const projectLink = project.id ? `a.btn-block[href="/project/${project.id}"]` : '#newproject'; // `a[href=\\/project\\/${projectId}`
    await page.waitFor(projectLink);
    await page.click(projectLink);

    // wait for the project detail page to load
    await page.waitFor('input#name');

    // fill in text input data for the new project
    await page.evaluate(() => {
      (document.getElementById('name') as HTMLInputElement).value = '';
    });
    await page.type('input#name', project.name);

    await page.evaluate(() => {
      (document.getElementById('description') as HTMLInputElement).value = '';
    });
    await page.type('input#description', project.description);

    await page.evaluate(() => {
      (document.getElementById('url') as HTMLInputElement).value = '';
    });
    await page.type('input#url', project.url);

    // fill in dropdown scenario
    await page.select('select[id="scenarioPkg.name"]', project.scenario);

    // wait for scenarioLink to be rendered, this means the plugin schemas are also rendered
    await page.waitFor('[id="scenarioLink"]');

    // fill in plugin props in sequential manner
    await project.plugins.reduce(
      async (pluginPromise: Promise<void>, plugin: IPluginDefinition) => {
        await pluginPromise;

        if (!plugin.opts) return Promise.resolve();

        return Object.getOwnPropertyNames(plugin.opts).reduce(
          async (pluginPropPromise: Promise<void>, pluginProp: string) => {
            await pluginPropPromise;
            const propId = `plugins.${plugin.name}.${pluginProp}`;
            await page.waitFor(`[id="${propId}"]`);

            const propTagName = await page.evaluate(propId => document.getElementById(propId).tagName, propId);

            // input field
            if (propTagName === 'INPUT' || propTagName === 'TEXTAREA') {
              await page.evaluate(propId => {
                (document.getElementById(propId) as HTMLInputElement).value = '';
              }, propId);
              await page.type(`[id="${propId}"]`, plugin.opts[pluginProp].toString());
            }
            // select field
            else if (propTagName === 'SELECT') {
              await page.select(`select[id="${propId}"]`, plugin.opts[pluginProp].toString());
            }
          },
          Promise.resolve(),
        );
      },
      Promise.resolve(),
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

    // read the file, delete it afterwards as firefox will not overwrite it on the next download
    const filePath = resolve(targetDir, `${project.name}.csv`);
    const generatedContent = readFileSync(resolve(targetDir, `${project.name}.csv`), 'utf8');
    unlinkSync(filePath);
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

     // read the file, delete it afterwards as firefox will not overwrite it on the next download
    const filePath = resolve(targetDir, `${project.name}.zip`);
    const generatedContent = readFileSync(resolve(targetDir, `${project.name}.zip`), 'binary');
    unlinkSync(filePath);
    const archive = await JSZip.loadAsync(generatedContent);

    return Object.keys(archive.files).map(name => archive.files[name].name);
  }
}
