export default class ActiveTabHelper {
  static executeScript(tabId, details) {
    return new Promise((resolve) => {
      chrome.tabs.executeScript(
        tabId,
        details,
        (result) => {
          if (result) {
            resolve(result[0]);
          }
          else resolve(result);
        },
      );
    });
  }

  static getCurrent() {
    return new Promise((resolve) => {
      chrome.tabs.query(
        { active: true },
        (tabs) => {
          resolve(tabs[0]);
        },
      );
    });
  }

  static create(createProperties) {
    return new Promise((resolve) => {
      chrome.tabs.create(
        createProperties || {},
        (tab) => {
          resolve(tab);
        },
      );
    });
  }

  static update(tabId, updateProperties) {
    return new Promise((resolve) => {
      chrome.tabs.update(
        tabId,
        updateProperties || {},
        (tab) => {
          // wait for the tab update to be completed, executeScript may throw errors otherwise
          const updateHandler = (updatedTabId, changeInfo) => {
            if (tabId === updatedTabId && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(updateHandler);
              resolve(tab);
            }
          };
          chrome.tabs.onUpdated.addListener(updateHandler);
        },
      );
    });
  }
}
