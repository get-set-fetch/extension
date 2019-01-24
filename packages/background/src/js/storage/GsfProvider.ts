import IdbStorage from './IdbStorage';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import PluginManager from '../plugins/PluginManager';
import IdbUserPlugin from './IdbUserPlugin';
import IdbSite from './IdbSite';
import IdbResource from './IdbResource';
import IdbLog from './IdbLog';
import IdbSetting from './IdbSetting';
import IdbProject from './IdbProject';

/* eslint-disable no-case-declarations */
export default class GsfProvider {
  static Site: typeof IdbSite;
  static Project: typeof IdbProject;
  static Resource: typeof IdbResource;
  static UserPlugin: typeof IdbUserPlugin;
  static Log: typeof IdbLog;
  static Setting: typeof IdbSetting;

  static async init() {
    // init extension storage
    const {
      Site, Resource, UserPlugin, Log, Setting
    } = await IdbStorage.init();
    GsfProvider.Site = Site;
    GsfProvider.Project = Project;
    GsfProvider.Resource = Resource;
    GsfProvider.UserPlugin = UserPlugin;
    GsfProvider.Log = Log;
    GsfProvider.Setting = Setting;

    // wait for client requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (true) {
        case /^site/.test(request.resource):
          this.siteHandler(request, sendResponse);
          break;
        case /^resource/.test(request.resource):
          this.resourceHandler(request, sendResponse);
          break;
        case /^plugin/.test(request.resource):
          this.pluginHandler(request, sendResponse);
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
      case 'GET':
        switch (true) {
          // sites
          case /^sites$/.test(request.resource):
            reqPromise = GsfProvider.Site.getAll();
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
            crawlSite.crawl(crawlSite.opts.crawl);
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
            const site = new GsfProvider.Site(request.body.name, request.body.url, request.body.opts, request.body.pluginDefinitions);
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
            const site = Object.assign(new GsfProvider.Site(null, null, null, null), request.body);
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

    switch (request.method) {
      case 'GET':
        switch (true) {
          // projects
          case /^projects$/.test(request.resource):
            reqPromise = GsfProvider.Project.getAll();
            break;
          // projects/:projectId
          case /^projects\/[0-9]+$/.test(request.resource):
            const getProjectId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Project.get(getProjectId);
            break;
          // project/{project.id}/crawl
          case /^project\/[0-9]+\/crawl$/.test(request.resource):
            const crawlProjectId = parseInt(/\d+/.exec(request.resource)[0], 10);
            const crawlProject = await GsfProvider.Project.get(crawlProjectId);
            reqPromise = new Promise(resolve => resolve());
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'POST':
        switch (true) {
          // project
          case /^project$/.test(request.resource):
            const project = new GsfProvider.Project(request.body.name, request.body.description, request.body.scenarioId);
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
            const project = Object.assign(new GsfProvider.Project(null, null, null), request.body);
            reqPromise = project.update();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'DELETE':
        switch (true) {
          // project
          case /^project$/.test(request.resource):
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
            reqPromise = GsfProvider.UserPlugin.getAll();
            break;
          // plugin/:pluginId
          case /^plugin\/[0-9]+$/.test(request.resource):
            const getPluginId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.UserPlugin.get(getPluginId);
            break;
          // plugin/:pluginName
          case /^plugin\/.+$/.test(request.resource):
            const getPluginName = /^plugin\/(.+)$/.exec(request.resource)[1];
            reqPromise = GsfProvider.UserPlugin.get(getPluginName);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'POST':
        switch (true) {
          // plugin
          case /^plugin$/.test(request.resource):
            const plugin = new GsfProvider.UserPlugin(request.body.name, request.body.code);
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
            const plugin = Object.assign(new GsfProvider.UserPlugin(null, null), request.body);
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
            reqPromise = GsfProvider.UserPlugin.delSome(request.body.ids);
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
            const setting = Object.assign(new GsfProvider.Setting(null, null), request.body);
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
