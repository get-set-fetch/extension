import * as untar from 'untar.js';
import { inflate as pakoInflate } from 'pako';
import BaseModuleManager from '../plugins/BaseModuleManager';
import GsfProvider from '../storage/GsfProvider';
import { IScenario, IModuleInfo } from 'get-set-fetch-extension-commons';
import PluginManager from '../plugins/PluginManager';
import Logger from '../logger/Logger';
import IdbPlugin from '../storage/IdbPlugin';
import IdbScenarioPackage from '../storage/IdbScenarioPackage';
import { IScenarioPackage } from 'get-set-fetch-extension-commons/lib/scenario';

const Log = Logger.getLogger('PluginManager');
export default class ScenarioManager extends BaseModuleManager {
  static cache: Map<string, IModuleInfo> = new Map();

  static persistScenarioPackages(scenarios: IdbScenarioPackage[]) {
    return Promise.all(
      scenarios.map(async (scenario) => {
        const storedScenario = await GsfProvider.ScenarioPackage.get(scenario.name);
        if (!storedScenario) {
          Log.info(`Saving scenario ${scenario.name} to database`);
          await scenario.save();
          Log.info(`Saving scenario ${scenario.name} to database DONE`);
        }
      })
    );
  }

  static async discoverLocalScenarios() {
    const scenarioPkgDefs: IScenarioPackage[] = await ScenarioManager.getLocalScenarios();
    const scenarioPkgs = scenarioPkgDefs.map(scenarioPkgDef => new GsfProvider.ScenarioPackage(scenarioPkgDef));
    await this.persistScenarioPackages(scenarioPkgs);

    // store plugins embedded with scenarios
    await Promise.all(
      scenarioPkgDefs.map(async (scenarioPkgDef) => {
        Log.info(`Checking ${scenarioPkgDef.name} for embedded plugins`);
        const scenario = await GsfProvider.ScenarioPackage.get(scenarioPkgDef.name);
        await ScenarioManager.register(scenarioPkgDef.name);
        const embeddedPluginNames = Object.keys(ScenarioManager.cache.get(scenarioPkgDef.name).module.embeddedPlugins);
        const embeddedPlugins = embeddedPluginNames.map(name => new GsfProvider.Plugin({
          scenarioId: scenario.id,
          name,
          code: null
        }));
        await PluginManager.persistPlugins(embeddedPlugins);
      })
    );
  }

  static async register(name: string) {
    // scenario already registered
    if (ScenarioManager.cache.get(name)) return;

    const scenario = await GsfProvider.ScenarioPackage.get(name);
    if (!scenario) {
      throw new Error(`could not register scenario ${name}`);
    }

    const scenarioBlob = new Blob([scenario.code], { type: 'text/javascript' });
    const scenarioUrl = URL.createObjectURL(scenarioBlob);
    const scenarioModule = await import(scenarioUrl);

    ScenarioManager.cache.set(
      name,
      {
        code: scenario.code,
        module: scenarioModule,
        url: scenarioUrl
      }
    );
  }

  static async instantiate(name: string): Promise<IScenario> {
    if (!ScenarioManager.cache.get(name)) {
      await ScenarioManager.register(name);
    }

    const classDef = ScenarioManager.cache.get(name).module.default;
    const scenarioInstance = new (classDef)() as IScenario;
    return scenarioInstance;
  }

  static async resolveEmbeddedPlugin(plugin: IdbPlugin) {
    if (!plugin.scenarioId) {
      throw new Error(`could not register scenario plugin ${plugin.name} without a scenarioId link`);
    }

    const scenario: IdbScenarioPackage = await IdbScenarioPackage.get(plugin.scenarioId);

    if (!ScenarioManager.cache.get(scenario.name)) {
      await ScenarioManager.register(scenario.name);
    }

    const embeddedPlugin = ScenarioManager.cache.get(scenario.name).module.embeddedPlugins[plugin.name];
    if (!embeddedPlugin) {
      throw new Error(`could not find embedded plugin ${plugin.name} on scenario ${scenario.name}`);
    }

    return {
      module: { default: embeddedPlugin },
      url: ScenarioManager.cache.get(scenario.name).url
    };
  }

  static async getNpmScenarios(): Promise<IScenarioPackage[]> {
    const scenarioUrls = await ScenarioManager.getNpmScenarioUrls();
    const scenarioPkgs = Promise.all(
      scenarioUrls.map(scenarioUrl => ScenarioManager.getNpmScenarioDetails(scenarioUrl))
    );
    return scenarioPkgs;
  }

  static async getNpmScenarioUrls(): Promise<string[]> {
    const readmeUrl = 'https://raw.githubusercontent.com/get-set-fetch/extension/master/README.md';
    const readmeResponse = await window.fetch(readmeUrl, { method: 'GET' });
    const readmeText = await readmeResponse.text();

    const scenarioSection = readmeText.match(/^### List of available scenarios\s([\s\S]+?)^###/gm)[0];
    const scenarioUrls = scenarioSection.match(/\(.+\)/g).map(fullMatch => fullMatch.substr(1, fullMatch.length - 2));

    return scenarioUrls;
  }

  static async getNpmScenarioDetails(npmUrl: string): Promise<IScenarioPackage> {
    // fetch package.json
    const npmResponse = await window.fetch(npmUrl, { method: 'GET' });
    const pkgJson = await npmResponse.json();

    // fetch tarball
    const pkgTgz = await window.fetch(pkgJson.dist.tarball, { method: 'GET' });

    // inflate zip
    const pkgTgzArrBuffer = await pkgTgz.arrayBuffer();
    const pkgTar: Uint8Array = pakoInflate(new Uint8Array(pkgTgzArrBuffer));

    // untar and store main file
    const mainFile = untar.untar(pkgTar).find(file => file.filename === `package/${pkgJson.main}`);
    const code = new TextDecoder('utf-8').decode(mainFile.fileData);

    // pick relevant json npm props
    const extractProps = ({ name, version, description, main, author, license, homepage, dist }) =>
      ({ name, version, description, main, author: author.name, license, homepage });

    const scenarioPackage: IScenarioPackage = { name: pkgJson.name, package: extractProps(pkgJson), code, builtin: false };
    return scenarioPackage;
  }

  static async installNpmScenario(npmUrl: string) {
    const scenarioPkgDef: IScenarioPackage = await ScenarioManager.getNpmScenarioDetails(npmUrl);
    await ScenarioManager.persistScenarioPackages([new GsfProvider.ScenarioPackage(scenarioPkgDef)]);
  }

  static async getLocalScenarios(): Promise<IScenarioPackage[]> {
    const scenarioDirs = await ScenarioManager.getLocalScenarioDirs('scenarios');
    const scenarioPkgs = Promise.all(
      scenarioDirs.map(scenarioDir => ScenarioManager.getLocalScenarioDetails(scenarioDir))
    );
    return scenarioPkgs;
  }

  static getLocalScenarioDirs(relativeDir: string): Promise<DirectoryEntry[]> {
    return new Promise((resolve, reject) => {
      let dirs: DirectoryEntry[] = [];

      chrome.runtime.getPackageDirectoryEntry((root) => {
        root.getDirectory(relativeDir, { create: false }, (modulesDir) => {
          const reader = modulesDir.createReader();
          // assume there are just a dozen plugins,
          // otherwise a loop mechanism should be implemented in order to call readEntries multiple times
          reader.readEntries(
            async (entries: Entry[]) => {
              dirs = entries.filter(entry => entry.isDirectory) as DirectoryEntry[];
              resolve(dirs);
            },
            (err) => {
              reject(err);
            }
          );
        });
      });
    });
  }

  static async getLocalScenarioDetails(dir: DirectoryEntry): Promise<IScenarioPackage> {
    // read local package.json
    const pkgFileContent: string = await new Promise((resolve) => {
      dir.getFile('package.json', {}, async (pkgFileEntry: FileEntry) => {
        const fileContent = await BaseModuleManager.getFileContent(pkgFileEntry);
        resolve(fileContent);
      });
    });
    const pkgJson = JSON.parse(pkgFileContent);

    // read local main file
    const code: string = await new Promise((resolve) => {
      dir.getFile(pkgJson.main, {}, async (mainFileEntry: FileEntry) => {
        const fileContent = await BaseModuleManager.getFileContent(mainFileEntry);
        resolve(fileContent);
      });
    });

    // pick relevant json npm props
    const extractProps = ({ name, version, description, main, author, license, homepage, dist }) =>
      ({ name, version, description, main, author: author.name, license, homepage });
    const scenarioPackage: IScenarioPackage = { name: pkgJson.name, package: extractProps(pkgJson), code, builtin: true };

    return scenarioPackage;
  }
}