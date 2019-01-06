/**
 * Plugin responsible for updating a resource after crawling it.
 */
export default class UpdateResourcePlugin {
  // eslint-disable-next-line class-methods-use-this
  test() {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  apply(site, resource) {
    return resource.update();
  }
}
