import { SchemaHelper, IPlugin, ISite, IResource } from 'get-set-fetch-extension-commons';

export default class ExtractHtmlContentPlugin implements IPlugin {
  opts: {
    runInTab: boolean;
    selectors: string;
  };

  constructor(opts) {
    this.opts = SchemaHelper.instantiate(ExtractHtmlContentPlugin.OPTS_SCHEMA, opts);
  }

  static get OPTS_SCHEMA() {
    return {
      $id: 'https://getsetfetch.org/extract-html-content-plugin.schema.json',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'ExtractHtmlContentPlugin',
      type: 'object',
      properties: {
        runInTab: {
          type: 'boolean',
          default: true,
        },
        selectors: {
          type: 'string',
          default: 'h1\nh2',
        },
      },
    };
  }

  test(resource: IResource) {
    return (/html/i).test(resource.mediaType);
  }

  apply(site: ISite, resource: IResource) {
    const selectors: string[] = this.opts.selectors.split('\n');
    const textResult = selectors.reduce(
      (result, selector) => Object.assign(
        result,
        {
          [selector.toString()]: Array.from(document.querySelectorAll(selector)).map(elm => (elm as HTMLElement).innerText),
        },
      ),
      {},
    );

    return {
      info: {
        content: textResult,
      },
    };
  }
}
