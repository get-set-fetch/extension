import SchemaHelper from '../../schema/SchemaHelper';

/**
 * Plugin responsible for selecting a resource to crawl from the current site.
 */
export default class SelectResourcePlugin {
  opts: any;

  constructor(opts) {
    this.opts = SchemaHelper.instantiate(SelectResourcePlugin.OPTS_SCHEMA, opts);
  }

  static get OPTS_SCHEMA() {
    return {
      $id: 'https://getsetfetch.org/extract-url-plugin.schema.json',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'SelectResourcePlugin',
      type: 'object',
      properties: {
        crawlFrequency: {
          type: 'number',
          default: '-1',
          help: 'How often a resource should be re-crawled (hours), enter -1 to never re-crawl'
        }
      }
    };
  }

  // eslint-disable-next-line class-methods-use-this
  test() {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  apply(site) {
    return site.getResourceToCrawl(this.opts.crawlFrequency);
  }
}
