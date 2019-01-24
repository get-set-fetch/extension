import { GsfProvider, PluginManager } from './background-bundle';
import Logger, { LogLevel } from './logger/Logger';
import IdbSetting from './storage/IdbSetting';
import ScenarioManager from './scenarios/ScenarioManager';

// const Log = Logger.getLogger('background-main');

/*
register GsfProvider at window level, required for:
  - accessing IndexedDB from SystemJS IdbFetchPlugin
  - accessing plugin module content from GsfProvider.UserPlugins.availablePlugins
*/
window.GsfProvider = GsfProvider;
declare const SystemJS;

SystemJS.config({
  map: {
    'idb': './plugins/systemjs/IdbFetchPlugin.js',
    'plugin-babel': './plugins/systemjs/plugin-babel.js',
    'systemjs-babel-build': './plugins/systemjs/systemjs-babel-browser.js'
  },
  transpiler: 'plugin-babel',
  meta: {
    '*.js': {
      babelOptions: {
        // extension run in browsers having ES2015 and stage 1-3 support, disable ES2015, stage 1-3 feature transpilation
        es2015: false,
        stage1: false,
        stage2: false,
        stage3: false
      }
    }
  }
});

(async () => {
  await GsfProvider.init();

  // 1. populate settings - logLevel - if not present
  const storedSettings = await GsfProvider.Setting.getAll();
  let logLevel = storedSettings.find(setting => setting.key === 'logLevel');
  if (!logLevel) {
    logLevel = new GsfProvider.Setting('logLevel', LogLevel.WARN);
    await logLevel.save();
  }
  Logger.setLogLevel(parseInt(logLevel.val, 10));

  // 2. read all builtin plugins, persist them as UserPlugin, import them in SystemJS
  await PluginManager.discoverPlugins();

  // 3. read all builtin scenarios, persist them as Scenario
  await ScenarioManager.discoverPlugins();
})();
