export default class GsfClient {
  static fetch(method, resource, body) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ method, resource, body }, (response) => {
        resolve(response);
      });
    });
  }
}
