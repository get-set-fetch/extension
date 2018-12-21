/**
 * Plugin responsible for saving new resources within the current site.
 */
export default class InsertResourcePlugin {
  // eslint-disable-next-line class-methods-use-this
  test() {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  apply(site, resource) {
    // only save new urls if there's something to save
    return resource.urlsToAdd && resource.urlsToAdd.length > 0 ?
      site.saveResources(resource.urlsToAdd, resource.depth + 1)
      :
      null;
  }
}
