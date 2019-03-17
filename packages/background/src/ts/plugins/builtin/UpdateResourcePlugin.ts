import { IPlugin } from 'get-set-fetch-extension-commons';

/**
 * Plugin responsible for updating a resource after crawling it.
 */
export default class UpdateResourcePlugin implements IPlugin {
  test() {
    return true;
  }

  apply(site, resource) {
    return resource.update();
  }
}
