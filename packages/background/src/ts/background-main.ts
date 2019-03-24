import { GsfProvider, PluginManager } from './background-bundle';
import Logger, { LogLevel } from './logger/Logger';
import ScenarioManager from './scenarios/ScenarioManager';

const Log = Logger.getLogger('background-main');

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

  try {
    // 2. read all builtin plugins, persist them as Plugin
    await PluginManager.discoverPlugins();

    // 3. read all builtin scenarios, persist them as Scenario
    await ScenarioManager.discoverScenarios();
  }
  catch (err) {
    Log.error(err);
  }

})();
