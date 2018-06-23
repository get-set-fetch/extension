export default class ActiveTabHelper {
  static executeScript(details) {
    return new Promise((resolve) => {
      chrome.tabs.executeScript(
        null,
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

  static update(tabId, updateProperties) {
    return new Promise((resolve) => {
      chrome.tabs.update(
        tabId,
        updateProperties,
        (tab) => {
          resolve(tab);
        },
      );
    });
  }
}
