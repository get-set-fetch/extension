import { HttpMethod } from 'get-set-fetch-extension-commons';
import IdbStorage from './IdbStorage';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import PluginManager from '../plugins/PluginManager';
import IdbPlugin from './IdbPlugin';
import IdbSite from './IdbSite';
import IdbResource from './IdbResource';
import IdbLog from './IdbLog';
import IdbSetting from './IdbSetting';
import IdbProject from './IdbProject';
import IdbScenarioPackage from './IdbScenarioPackage';
import ExportHelper from '../helpers/ExportHelper';
import ScenarioManager from '../scenarios/ScenarioManager';

/* eslint-disable no-case-declarations */
export default class GsfProvider {
  static Site: typeof IdbSite;
  static Project: typeof IdbProject;
  static ScenarioPackage: typeof IdbScenarioPackage;
  static Resource: typeof IdbResource;
  static Plugin: typeof IdbPlugin;
  static Log: typeof IdbLog;
  static Setting: typeof IdbSetting;

  static async init() {
    // init extension storage
    const {
      Site, Project, ScenarioPackage, Resource, Plugin, Log, Setting
    } = await IdbStorage.init();
    GsfProvider.Site = Site;
    GsfProvider.Project = Project;
    GsfProvider.ScenarioPackage = ScenarioPackage;
    GsfProvider.Resource = Resource;
    GsfProvider.Plugin = Plugin;
    GsfProvider.Log = Log;
    GsfProvider.Setting = Setting;

    // wait for client requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (true) {
        case /^site/.test(request.resource):
          this.siteHandler(request, sendResponse);
          break;
        case /^project/.test(request.resource):
          this.projectHandler(request, sendResponse);
          break;
        case /^resource/.test(request.resource):
          this.resourceHandler(request, sendResponse);
          break;
        case /^plugin/.test(request.resource):
          this.pluginHandler(request, sendResponse);
          break;
        case /^scenario/.test(request.resource):
          this.scenarioHandler(request, sendResponse);
          break;
        case /^log/.test(request.resource):
          this.logHandler(request, sendResponse);
          break;
        case /^setting/.test(request.resource):
          this.settingHandler(request, sendResponse);
          break;
        default:
      }

      // enable wait for callback
      return true;
    });
  }

  static async siteHandler(request, sendResponse) {
    let reqPromise = null;

    switch (request.method) {
      case HttpMethod.GET:
        switch (true) {
          // sites
          case /^sites$/.test(request.resource):
            reqPromise = GsfProvider.Site.getAll();
            break;
          // sites/:projectId
          case /^sites\/[0-9]+$/.test(request.resource):
            const projectId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Site.getAll(projectId);
            break;
          // site/:siteId
          case /^site\/[0-9]+$/.test(request.resource):
            const getSiteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Site.get(getSiteId);
            break;
          // site/:siteName , don't allow "/" so that we can differentiate /crawl verb as another switch option
          case /^site\/[^/]+$/.test(request.resource):
            const getSiteName = /^site\/(.+)$/.exec(request.resource)[1];
            reqPromise = GsfProvider.Site.get(getSiteName);
            break;
          // site/{site.id}/crawl
          case /^site\/[0-9]+\/crawl$/.test(request.resource):
            const crawlSiteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            const crawlSite = await GsfProvider.Site.get(crawlSiteId);

            // open a new tab for the current site to be crawled into
            const tab = await ActiveTabHelper.create();
            crawlSite.tabId = tab.id;

            // start crawling
            crawlSite.crawl();
            reqPromise = new Promise(resolve => resolve());
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'POST':
        switch (true) {
          // site
          case /^site$/.test(request.resource):
            const site = new GsfProvider.Site(request.body);
            reqPromise = site.save();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'PUT':
        switch (true) {
          // site
          case /^site$/.test(request.resource):
            const site = new GsfProvider.Site(request.body);
            reqPromise = site.update();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'DELETE':
        switch (true) {
          // sites
          case /^sites$/.test(request.resource):
            reqPromise = GsfProvider.Site.delSome(request.body.ids);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
        reqPromise = new Promise(resolve => resolve());
    }

    reqPromise.then((result) => {
      sendResponse(result);
    });
  }

  static async projectHandler(request, sendResponse) {
    let reqPromise = null;
    let projectId;

    switch (request.method) {
      case 'GET':
        switch (true) {
          // projects
          case /^projects$/.test(request.resource):
            reqPromise = GsfProvider.Project.getAll();
            break;
          // project/export/:projectId
          case /^project\/export\/[0-9]+$/.test(request.resource):
            projectId = parseInt(/\d+/.exec(request.resource)[0], 10);
            const resources = await GsfProvider.Project.getAllResources(projectId);
            reqPromise = ExportHelper.export(resources, request.body);
            break;
          // project/:projectId
          case /^project\/[0-9]+$/.test(request.resource):
            projectId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Project.get(projectId);
            break;
          // project/:projectName , don't allow "/" so that we can differentiate /crawl verb as another switch option
          case /^project\/[^/]+$/.test(request.resource):
            const projectName = /^project\/(.+)$/.exec(request.resource)[1];
            reqPromise = GsfProvider.Project.get(projectName);
            break;
          // project/{project.id}/crawl
          case /^project\/[0-9]+\/crawl$/.test(request.resource):
            projectId = parseInt(/\d+/.exec(request.resource)[0], 10);
            const crawlProject = await GsfProvider.Project.get(projectId);

            // start crawling
            crawlProject.crawl();
            reqPromise = new Promise(resolve => resolve());
            break;
          // project/{project.id}/resources
          case /^project\/[0-9]+\/resources$/.test(request.resource):
            projectId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Project.getAllResources(projectId);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'POST':
        switch (true) {
          // project
          case /^project$/.test(request.resource):
            const project = new GsfProvider.Project(request.body);
            reqPromise = project.save();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'PUT':
        switch (true) {
          // project
          case /^project$/.test(request.resource):
            const project = new GsfProvider.Project(request.body);
            reqPromise = project.update();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'DELETE':
        switch (true) {
          // project
          case /^projects$/.test(request.resource):
            reqPromise = GsfProvider.Project.delSome(request.body.ids);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
        reqPromise = new Promise(resolve => resolve());
    }

    reqPromise.then((result) => {
      sendResponse(result);
    });
  }

  static async resourceHandler(request, sendResponse) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // resources/:siteId
          case /^resources\/[0-9]+$/.test(request.resource):
            const siteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Resource.getAll(siteId, null, false);
            break;
          // resources/:siteId/notcrawled
          case /^resources\/[0-9]+\/notcrawled$/.test(request.resource):
            const notCrawledSiteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Resource.getAllNotCrawled(notCrawledSiteId);
            break;
          // resources/:siteId/crawled
          case /^resources\/[0-9]+\/crawled$/.test(request.resource):
            const crawledSiteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Resource.getAllCrawled(crawledSiteId);
            break;
          // resource/:urlOrId
          case /^resource\/.+$/.test(request.resource):
            const urlOrId = /^resource\/(.+)$/.exec(request.resource)[1];
            reqPromise = GsfProvider.Resource.get(urlOrId);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
        reqPromise = new Promise(resolve => resolve());
    }

    reqPromise.then((result) => {
      sendResponse(result);
    });
  }

  static async pluginHandler(request, sendResponse) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // available plugin definitions {name, opts}
          case /^plugindefs\/available$/.test(request.resource):
            reqPromise = new Promise(resolve => resolve(PluginManager.getAvailablePluginDefs()));
            break;
          // default plugin definitions {name, opts}
          case /^plugindefs\/default$/.test(request.resource):
            reqPromise = new Promise(resolve => resolve(PluginManager.getDefaultPluginDefs()));
            break;
          // plugins
          case /^plugins$/.test(request.resource):
            reqPromise = GsfProvider.Plugin.getAll();
            break;
          // plugin/:pluginId
          case /^plugin\/[0-9]+$/.test(request.resource):
            const getPluginId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Plugin.get(getPluginId);
            break;
          // plugin/:pluginName
          case /^plugin\/.+$/.test(request.resource):
            const getPluginName = /^plugin\/(.+)$/.exec(request.resource)[1];
            reqPromise = GsfProvider.Plugin.get(getPluginName);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'POST':
        switch (true) {
          // plugin
          case /^plugin$/.test(request.resource):
            const plugin = new GsfProvider.Plugin(request.body);
            reqPromise = plugin.save();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'PUT':
        switch (true) {
          // plugin
          case /^plugin$/.test(request.resource):
            const plugin = new GsfProvider.Plugin(request.body);
            reqPromise = plugin.update();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'DELETE':
        switch (true) {
          // plugins
          case /^plugins$/.test(request.resource):
            reqPromise = GsfProvider.Plugin.delSome(request.body.ids);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
        reqPromise = new Promise(resolve => resolve());
    }

    reqPromise.then((result) => {
      sendResponse(result);
    });
  }

  static async scenarioHandler(request, sendResponse) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // scenarios
          case /^scenarios$/.test(request.resource):
            reqPromise = GsfProvider.ScenarioPackage.getAll();
            break;
          // available scenarios
          case /^scenarios\/available$/.test(request.resource):
            reqPromise = ScenarioManager.getNpmScenarios();
            break;
          // scenario/:scenarioId
          case /^scenario\/[0-9]+$/.test(request.resource):
            const getScenarioId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.ScenarioPackage.get(getScenarioId);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'POST':
        switch (true) {
          // scenario
          case /^scenario$/.test(request.resource):
            reqPromise = ScenarioManager.installNpmScenario({ pkgDef: request.body });
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'DELETE':
        switch (true) {
          // scenarios
          case /^scenarios$/.test(request.resource):
            reqPromise = GsfProvider.ScenarioPackage.delSome(request.body.ids);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
        reqPromise = new Promise(resolve => resolve());
    }

    reqPromise.then((result) => {
      sendResponse(result);
    });
  }

  static async logHandler(request, sendResponse) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // logs
          case /^logs$/.test(request.resource):
            reqPromise = GsfProvider.Log.getAll();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'DELETE':
        switch (true) {
          // logs
          case /^logs$/.test(request.resource):
            reqPromise = GsfProvider.Log.delAll();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
        reqPromise = new Promise(resolve => resolve());
    }

    reqPromise.then((result) => {
      sendResponse(result);
    });
  }

  static async settingHandler(request, sendResponse) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // settings
          case /^settings$/.test(request.resource):
            reqPromise = GsfProvider.Setting.getAll();
            break;
          // setting/:key
          case /^setting\/.+$/.test(request.resource):
            const key = /^setting\/(.+)$/.exec(request.resource)[1];
            reqPromise = GsfProvider.Setting.get(key);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'PUT':
        switch (true) {
          // settings
          case /^setting$/.test(request.resource):
            const setting = new GsfProvider.Setting(request.body);
            reqPromise = setting.update();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
        reqPromise = new Promise(resolve => resolve());
    }

    reqPromise.then((result) => {
      sendResponse(result);
    });
  }
}
