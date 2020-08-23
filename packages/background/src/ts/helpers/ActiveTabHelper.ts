import Logger from '../logger/Logger';

const Log = Logger.getLogger('IdbSite');

export default class ActiveTabHelper {
  static async executeAsyncScript(tabId: number, code, Log = null) {
    let result = {};

    try {
      // listen for incoming message
      const message = new Promise((resolve, reject) => {
        const listener = msg => {
          /*
          this is not a message sent via runInDom, ignore it,
          messages may also come from admin GsfClient, test utils CrawlHelper.waitForCrawlComplete
          */
          if (msg.resolved === undefined) return;

          browser.runtime.onMessage.removeListener(listener);
          if (msg.resolved) {
            resolve(msg.result);
          }
          else {
            reject(msg.err);
          }
        };
        browser.runtime.onMessage.addListener(listener);
      });

      await ActiveTabHelper.executeScript(tabId, { code });

      result = await message;
    }
    catch (err) {
      if (Log) Log.error(err);
      throw err;
    }

    return result;
  }

  static async executeScript<T = any>(tabId: number, details): Promise<T> {
    try {
      const frameResults = await browser.tabs.executeScript(tabId, details);
      return frameResults[0];
    }
    catch (err) {
      throw new Error('could not execute script');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  static async create(createProperties = {}, onRemoved: () => void = () => {}): Promise<browser.tabs.Tab> {
    const tab: browser.tabs.Tab = await browser.tabs.create(createProperties || {});
    Log.info(`scrape tab ${tab.id} created`);

    // invalidate site.tabIds for all project sites, scrape will stop as there's no opened tab for it
    const onRemovedListener = tabId => {
      // only react to the opened scraping tab
      if (tabId === tab.id) {
        Log.info(`removing scrape tab ${tabId}`);
        browser.tabs.onRemoved.removeListener(onRemovedListener);
        onRemoved();
      }
    };
    browser.tabs.onRemoved.addListener(onRemovedListener);

    // tab is fully loaded
    if (tab.status === 'complete') {
      return tab;
    }

    // tab is still loading, listen for its update
    return new Promise(resolve => {
      // wait for tab loading to complete
      const onUpdatedListener = (tabId, changeInfo) => {
        // only react to the opened scraping tab
        if (tabId === tab.id && changeInfo.status === 'complete') {
          browser.tabs.onUpdated.removeListener(onRemovedListener);
          resolve(tab);
        }
      };

      browser.tabs.onUpdated.addListener(onUpdatedListener);
    });
  }

  static async close(tabId: number = null): Promise<void> {
    let activeTabId;

    if (!tabId) {
      const filteredTabs = await browser.tabs.query({ active: true });
      activeTabId = filteredTabs[0].id;
    }
    else {
      activeTabId = tabId;
    }

    await browser.tabs.remove(activeTabId);
  }

  static update(tabId: number, updateProperties):Promise<browser.tabs.Tab> {
    return new Promise(async (resolve, reject): Promise<void> => {
      let tab;

      try {
        tab = await browser.tabs.update(tabId, updateProperties);
      }
      catch (err) {
        reject(err);
      }

      // tab is fully loaded
      if (tab.status === 'complete') {
        resolve(tab);
      }
      else {
        // wait for the tab update to be completed, executeScript may throw errors otherwise
        const updateHandler = (updatedTabId, changeInfo, updatedTab) => {
          if (tabId === updatedTabId && changeInfo.status === 'complete') {
            browser.tabs.onUpdated.removeListener(updateHandler);
            resolve(updatedTab);
          }
        };
        browser.tabs.onUpdated.addListener(updateHandler);
      }
    });
  }
}
