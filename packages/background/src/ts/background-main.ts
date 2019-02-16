// import SystemJS + fetch hook + getRegistry() implementation
import 'systemjs/dist/system';
import '../../src/ts/systemjs/systemjs-fetch-plugin';
import '../../src/ts/systemjs/systemjs-registry';

import { GsfProvider, PluginManager } from './background-bundle';
import Logger, { LogLevel } from './logger/Logger';
import ScenarioManager from './scenarios/ScenarioManager';

// const Log = Logger.getLogger('background-main');

// make use of systemjs fetch (custom) hook in order to load plugins from IndexedDB
System.constructor.prototype.fetch = (url: string, init: RequestInit) => {
  const pluginName = url;

  return new Promise(async (resolve) => {
    const plugin = await GsfProvider.Plugin.get(pluginName);

    /*
    cache module content
    this is used for the plugins running in the target page and not inside the browser extension
    */
    GsfProvider.Plugin.cache[pluginName] = plugin.code;
    resolve(plugin.code);
  });
};

(async () => {
  await GsfProvider.init();

  // 1. populate settings - logLevel - if not present
  const storedSettings = await GsfProvider.Setting.getAll();
  let logLevel = storedSettings.find(setting => setting.key === 'logLevel');
  if (!logLevel) {
    logLevel = new GsfProvider.Setting({ key: 'logLevel', val: LogLevel.WARN.toString() });
    await logLevel.save();
  }
  Logger.setLogLevel(parseInt(logLevel.val, 10));

  // 2. read all builtin plugins, persist them as Plugin, import them in SystemJS
  await PluginManager.discoverPlugins();

  // 3. read all builtin scenarios, persist them as Scenario
  await ScenarioManager.discoverPlugins();
})();
