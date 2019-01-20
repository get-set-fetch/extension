export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
}
export default class GsfClient {
  static fetch(method:HttpMethod, resource:string, body?:object):Promise<object> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ method, resource, body }, (response) => {
        resolve(response);
      });
    });
  }
}
