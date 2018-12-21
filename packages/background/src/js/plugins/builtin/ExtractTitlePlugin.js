import SchemaHelper from '../../schema/SchemaHelper';

export default class ExtractTitlePlugin {
  constructor(opts) {
    this.opts = SchemaHelper.instantiate(ExtractTitlePlugin.OPTS_SCHEMA, opts);
  }

  static get OPTS_SCHEMA() {
    return {
      $id: 'https://getsetfetch.org/extract-url-plugin.schema.json',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'ExtractTitlePlugin',
      type: 'object',
      properties: {
        runInTab: {
          type: 'boolean',
          default: 'true',
        },
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  test() {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  apply() {
    return {
      info: {
        title: document.title,
      },
    };
  }
}
