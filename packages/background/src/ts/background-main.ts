import { LogLevel } from 'get-set-fetch-extension-commons';
import Logger from './logger/Logger';
import ModuleStorageManager from './plugins/ModuleStorageManager';
import GsfProvider from './storage/GsfProvider';

const Log = Logger.getLogger('background-main');

(async () => {
  try {
    // handle toolbar click
    chrome.browserAction.onClicked.addListener(() => {
      const adminUrl = chrome.runtime.getURL('admin/admin.html');
      chrome.tabs.create({ url: adminUrl });
    });

    // handle install / uninstall events
    chrome.runtime.onInstalled.addListener(() => {
      chrome.tabs.create({ url: 'https://getsetfetch.org/extension/thank-you-install.html' });
    });
    chrome.runtime.setUninstallURL('https://getsetfetch.org/extension/thank-you-uninstall.html');

    await GsfProvider.init();

    // populate settings - logLevel - if not present
    const storedSettings = await GsfProvider.Setting.getAll();
    let logLevel = storedSettings.find(setting => setting.key === 'logLevel');
    if (!logLevel) {
      logLevel = new GsfProvider.Setting({ key: 'logLevel', val: LogLevel.WARN });
      await logLevel.save();
    }
    Logger.setLogLevel(logLevel.val);

    // read all builtin plugins, persist them as Plugin
    await ModuleStorageManager.discoverLocalPlugins();

    // read all builtin scenarios, persist them as Scenario
    await ModuleStorageManager.discoverLocalScenarios();
  }
  catch (err) {
    Log.error(err);
  }
})();
