import SchemaHelper from '../../schema/SchemaHelper';
import { IPlugin } from 'get-set-fetch';

/**
 * Plugin responsible for selecting a resource to crawl from the current site.
 */
export default class SelectResourcePlugin implements IPlugin {
  opts: {
    crawlFrequency: number
  };

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

  test() {
    return true;
  }

  apply(site) {
    return site.getResourceToCrawl(this.opts.crawlFrequency);
  }
}
