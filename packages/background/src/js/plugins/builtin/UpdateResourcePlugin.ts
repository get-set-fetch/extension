/**
 * Plugin responsible for updating a resource after crawling it.
 */
export default class UpdateResourcePlugin {
  test() {
    return true;
  }

  apply(site, resource) {
    return resource.update();
  }
}
