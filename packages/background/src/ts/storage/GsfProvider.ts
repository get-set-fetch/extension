/* eslint-disable prefer-destructuring */
import { HttpMethod } from 'get-set-fetch-extension-commons';
import IdbStorage from './IdbStorage';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import IdbPlugin from './IdbPlugin';
import IdbSite from './IdbSite';
import IdbResource from './IdbResource';
import IdbLog from './IdbLog';
import IdbSetting from './IdbSetting';
import IdbProject from './IdbProject';
import IdbScenario from './IdbScenario';
import ExportHelper from '../helpers/ExportHelper';
import Logger from '../logger/Logger';
import ModuleStorageManager from '../plugins/ModuleStorageManager';
import ModuleNpmManager from '../plugins/ModuleNpmManager';
import ModuleRuntimeManager from '../plugins/ModuleRuntimeManager';

const GsfLog = Logger.getLogger('GsfProvider');

/* eslint-disable no-case-declarations */
export default class GsfProvider {
  static Site: typeof IdbSite;
  static Project: typeof IdbProject;
  static Scenario: typeof IdbScenario;
  static Resource: typeof IdbResource;
  static Plugin: typeof IdbPlugin;
  static Log: typeof IdbLog;
  static Setting: typeof IdbSetting;

  static async init() {
    // init extension storage
    const {
      Site, Project, Scenario, Resource, Plugin, Log, Setting,
    } = await IdbStorage.init();
    GsfProvider.Site = Site;
    GsfProvider.Project = Project;
    GsfProvider.Scenario = Scenario;
    GsfProvider.Resource = Resource;
    GsfProvider.Plugin = Plugin;
    GsfProvider.Log = Log;
    GsfProvider.Setting = Setting;

    // wait for client requests
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
      let reqPromise = null;

      /*
      this is not a message sent via admin GsfClient
      messages may be triggered by ActiveTabHelper.executeAsyncScript, ignore these
      */
      if (request.resolved) return false;

      try {
        switch (true) {
          case /^site/.test(request.resource):
            reqPromise = this.siteHandler(request);
            break;
          case /^project/.test(request.resource):
            reqPromise = this.projectHandler(request);
            break;
          case /^resource/.test(request.resource):
            reqPromise = this.resourceHandler(request);
            break;
          case /^plugin/.test(request.resource):
            reqPromise = this.pluginHandler(request);
            break;
          case /^scenario/.test(request.resource):
            reqPromise = this.scenarioHandler(request);
            break;
          case /^log/.test(request.resource):
            reqPromise = this.logHandler(request);
            break;
          case /^setting/.test(request.resource):
            reqPromise = this.settingHandler(request);
            break;
          case /^utils/.test(request.resource):
            reqPromise = this.utilsHandler(request);
            break;
          default:
            throw new Error(`invalid resource ${request.resource}`);
        }

        if (!reqPromise) {
          throw new Error(`invalid request promise against request ${JSON.stringify(request)}`);
        }

        reqPromise.then(
          result => {
            sendResponse(result);
          },
          error => {
            sendResponse({ error: error.message });
          },
        );
      }
      catch (err) {
        GsfLog.error('Something went wrong.', err);
        sendResponse({ error: err.message });
      }

      // enable wait for callback
      return true;
    });
  }

  static async siteHandler(request) {
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

    return reqPromise;
  }

  static async projectHandler(request) {
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
            reqPromise = ExportHelper.exportResources(resources, request.body);
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
            reqPromise = crawlProject.crawl();
            break;
          // project/{project.id}/resources
          case /^project\/[0-9]+\/resources$/.test(request.resource):
            projectId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Project.getAllResources(projectId);
            break;
          // project/{project.id}/resources
          case /^project\/[0-9]+\/csv$/.test(request.resource):
            projectId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Project.getAllResourcesAsCsv(projectId, request.body);
            break;
          // project/{project.id}/config
          case /^project\/[0-9]+\/config$/.test(request.resource):
            projectId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Project.encodeConfigHash(projectId);
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
          // project/config
          case /^project\/config$/.test(request.resource):
            reqPromise = GsfProvider.Project.decodeConfigHash(request.body);
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

    return reqPromise;
  }

  static async resourceHandler(request) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // resources/:siteId
          case /^resources\/[0-9]+$/.test(request.resource):
            const siteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Resource.getAll(siteId, null, false);
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

    return reqPromise;
  }

  static async pluginHandler(request) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // available plugin definitions {name, opts}
          case /^plugindefs\/available$/.test(request.resource):
            reqPromise = new Promise(resolve => resolve(ModuleStorageManager.getAvailablePluginDefs()));
            break;
          // default plugin definitions {name, opts}
          case /^plugindefs\/default$/.test(request.resource):
            reqPromise = new Promise(resolve => resolve(ModuleStorageManager.getDefaultPluginDefs()));
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

    return reqPromise;
  }

  static async scenarioHandler(request) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // scenarios
          case /^scenarios$/.test(request.resource):
            reqPromise = GsfProvider.Scenario.getAll();
            break;
          // available scenarios
          case /^scenarios\/available$/.test(request.resource):
            reqPromise = ModuleNpmManager.getNpmScenarios();
            break;
          // scenario/{:scenarioName}/pluginSchemas
          case /^scenario\/.+\/pluginSchemas$/.test(request.resource):
            const name = /^scenario\/(.+)\/pluginSchemas$/.exec(request.resource)[1];
            reqPromise = ModuleRuntimeManager.getPluginSchemas(name);
            break;
          // scenario/:scenarioNameOrId
          case /^scenario\/.+$/.test(request.resource):
            const nameOrId = /^scenario\/(.+)$/.exec(request.resource)[1];
            reqPromise = GsfProvider.Scenario.get(nameOrId);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'POST':
        switch (true) {
          // scenario
          case /^scenario$/.test(request.resource):
            reqPromise = ModuleNpmManager.installNpmScenario({ pkgDef: request.body });
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'DELETE':
        switch (true) {
          // scenarios
          case /^scenarios$/.test(request.resource):
            reqPromise = GsfProvider.Scenario.delSome(request.body.ids);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
        reqPromise = new Promise(resolve => resolve());
    }

    return reqPromise;
  }

  static async logHandler(request) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // logs
          case /^logs$/.test(request.resource):
            reqPromise = GsfProvider.Log.getAll();
            break;
          // project/export/:projectId
          case /^logs\/export$/.test(request.resource):
            const logEntries = await GsfProvider.Log.getAll();
            reqPromise = ExportHelper.exportLogs(logEntries);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'POST':
        switch (true) {
          case /^logs$/.test(request.resource):
            reqPromise = GsfLog.generic(request.body);
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

    return reqPromise;
  }

  static async settingHandler(request) {
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
          case /^settings\/stores$/.test(request.resource):
            reqPromise = IdbStorage.getStores();
            break;
          case /^settings\/stores\/export$/.test(request.resource):
            reqPromise = IdbStorage.exportStores(request.body.stores);
            break;
          case /^settings\/stores\/import$/.test(request.resource):
            reqPromise = IdbStorage.importStores(request.body.stores, request.body.content);
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

            // immediately propagate settings changes
            if (setting.key === 'logLevel') {
              Logger.setLogLevel(setting.val);
            }
            reqPromise = setting.update();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
        reqPromise = new Promise(resolve => resolve());
    }

    return reqPromise;
  }

  static async utilsHandler(request) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // close active tab
          case /^utils\/closeactivetab$/.test(request.resource):
            reqPromise = ActiveTabHelper.close();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
        reqPromise = new Promise(resolve => resolve());
    }

    return reqPromise;
  }
}
