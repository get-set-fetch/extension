import { LogLevel } from 'get-set-fetch-extension-commons';
import Logger from './logger/Logger';
import ModuleStorageManager from './plugins/ModuleStorageManager';
import GsfProvider from './storage/GsfProvider';
import IdbSite from './storage/IdbSite';

const Log = Logger.getLogger('background-main');

(async () => {
  try {
    // handle toolbar click
    browser.browserAction.onClicked.addListener(() => {
      const adminUrl = browser.runtime.getURL('admin/admin.html');
      browser.tabs.create({ url: adminUrl });
    });

    // handle install / uninstall events
    browser.runtime.onInstalled.addListener(() => {
      browser.tabs.create({ url: 'https://getsetfetch.org/thank-you-install.html' });
    });
    browser.runtime.setUninstallURL('https://getsetfetch.org/thank-you-uninstall.html');

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

    // set all sites as not crawlInProgress
    await IdbSite.resetAllCrawlInProgress();
  }
  catch (err) {
    Log.error(err);
  }
})();
