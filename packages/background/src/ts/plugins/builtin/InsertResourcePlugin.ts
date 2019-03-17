import { IPlugin } from 'get-set-fetch-extension-commons';

/**
 * Plugin responsible for saving new resources within the current site.
 */
export default class InsertResourcePlugin implements IPlugin {
  test() {
    return true;
  }

  apply(site, resource) {
    // only save new urls if there's something to save
    return resource.urlsToAdd && resource.urlsToAdd.length > 0
      ? site.saveResources(resource.urlsToAdd, resource.depth + 1) : null;
  }
}
