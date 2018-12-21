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
}
