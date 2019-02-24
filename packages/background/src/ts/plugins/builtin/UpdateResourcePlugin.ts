import { IPlugin } from 'get-set-fetch';

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
