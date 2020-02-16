import * as untar from 'untar.js';
import { inflate as pakoInflate } from 'pako';
import { IScenarioStorage } from 'get-set-fetch-extension-commons';
import GsfProvider from '../storage/GsfProvider';
import Logger from '../logger/Logger';
import ModuleStorageManager from './ModuleStorageManager';

const Log = Logger.getLogger('ModuleNpmManager');

export default class ModuleNpmManager {
  static async getNpmScenarios(): Promise<IScenarioStorage[]> {
    const scenarioUrls = await ModuleNpmManager.getNpmScenarioUrls();
    const scenarioPkgs = Promise.all(
      scenarioUrls.map(scenarioUrl => ModuleNpmManager.getNpmScenarioDetails(scenarioUrl)),
    );
    return scenarioPkgs;
  }

  static async getNpmScenarioUrls(): Promise<string[]> {
    const readmeUrl = 'https://raw.githubusercontent.com/get-set-fetch/extension/master/README.md';
    const readmeResponse = await window.fetch(readmeUrl, { method: 'GET' });
    const readmeText = await readmeResponse.text();

    const scenarioSection = readmeText.match(/^You can also install community based scenarios:\s([\s\S]+?)^#/gm)[0];
    const npmLinkRegExp = /\[v[0-9.]+\]\((?<link>.+)\)/g;
    let npmLinkMatches;
    const npmLinks = [];
    while ((npmLinkMatches = npmLinkRegExp.exec(scenarioSection))) {
      npmLinks.push(npmLinkMatches.groups.link);
    }

    return npmLinks;
  }

  static async getNpmScenarioDetails(npmUrl: string): Promise<IScenarioStorage> {
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
    const extractProps = (
      { name, version, description, main, author, license, homepage },
    ) => ({ name, version, description, main, author: author.name, license, homepage });

    const scenarioPackage: IScenarioStorage = { name: pkgJson.name, package: extractProps(pkgJson), code, builtin: false };
    return scenarioPackage;
  }

  static async installNpmScenario({ npmUrl, pkgDef }: {npmUrl?: string; pkgDef?: IScenarioStorage}) {
    let scenarioPkgDef: IScenarioStorage = pkgDef;
    if (npmUrl) {
      scenarioPkgDef = await ModuleNpmManager.getNpmScenarioDetails(npmUrl);
    }
    await ModuleStorageManager.persistModules([ new GsfProvider.Scenario(scenarioPkgDef) ]);

    // store plugins embedded with scenarios
    await ModuleStorageManager.storeEmbeddedPlugins([ scenarioPkgDef ]);
  }
}
