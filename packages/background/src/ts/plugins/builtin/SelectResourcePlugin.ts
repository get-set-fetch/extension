import { SchemaHelper, IPlugin } from 'get-set-fetch-extension-commons';

/**
 * Plugin responsible for selecting a resource to crawl from the current site.
 */
export default class SelectResourcePlugin implements IPlugin {
  opts: {
    crawlFrequency: number;
    delay: number;
  };

  static get OPTS_SCHEMA() {
    return {
      $id: 'https://getsetfetch.org/select-resource-plugin.schema.json',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'SelectResourcePlugin',
      type: 'object',
      properties: {
        crawlFrequency: {
          type: 'number',
          default: '-1',
          help: 'How often a resource should be re-crawled (hours), enter -1 to never re-crawl.',
        },
        delay: {
          type: 'number',
          default: '1000',
          help: 'Delay in miliseconds between fetching two consecutive resources.',
        },
      },
    };
  }

  constructor(opts) {
    this.opts = SchemaHelper.instantiate(SelectResourcePlugin.OPTS_SCHEMA, opts);
  }

  test() {
    return true;
  }

  async apply(site) {
    await new Promise(resolve => setTimeout(resolve, this.opts.delay));
    return site.getResourceToCrawl(this.opts.crawlFrequency);
  }
}
