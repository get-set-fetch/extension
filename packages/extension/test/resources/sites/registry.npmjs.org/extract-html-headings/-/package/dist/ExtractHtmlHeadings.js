let HttpMethod;
(function (HttpMethod) {
  HttpMethod.GET = 'GET';
  HttpMethod.POST = 'POST';
  HttpMethod.PUT = 'PUT';
  HttpMethod.DELETE = 'DELETE';
}(HttpMethod || (HttpMethod = {})));
let ExportType;
(function (ExportType) {
  ExportType.CSV = 'csv';
  ExportType.ZIP = 'zip';
}(ExportType || (ExportType = {})));
let LogLevel;
(function (LogLevel) {
  LogLevel[LogLevel.TRACE = 0] = 'TRACE';
  LogLevel[LogLevel.DEBUG = 1] = 'DEBUG';
  LogLevel[LogLevel.INFO = 2] = 'INFO';
  LogLevel[LogLevel.WARN = 3] = 'WARN';
  LogLevel[LogLevel.ERROR = 4] = 'ERROR';
}(LogLevel || (LogLevel = {})));

class SchemaHelper {
  static instantiate(schema, data) {
    switch (schema.type) {
      case 'object':
        return this.parseObject(schema, data || {});
      case 'string':
        return this.parseString(schema, data);
      case 'number':
        return this.parseNumber(schema, data);
      case 'boolean':
        return this.parseBoolean(schema, data);
      default:
        return null;
    }
  }

  static parseObject(schema, data) {
    const inst = {};
    if (schema.properties) {
      Object.keys(schema.properties).forEach(propKey => {
        inst[propKey] = this.instantiate(schema.properties[propKey], data[propKey]);
      });
    }
    return inst;
  }

  static parseString(schema, data) {
    if (schema.format === 'regex') {
      let regex = null;
      // provided value for instantiation is already a regexp
      if (data instanceof RegExp) {
        regex = data;
      }
      // try to extract an regexp from the provided value with fallback to schema default string value
      else {
        const pattern = data || schema.const || schema.default;
        // no pattern to construct
        if (!pattern || pattern.length === 0) return undefined;
        const patternAndFlags = pattern.match(/^\/(.+)\/([gim]*)$/);
        // valid regexp identified
        if (patternAndFlags) {
          try {
            regex = new RegExp(patternAndFlags[1], patternAndFlags[2]);
          }
          catch (err) {
            throw new Error(`Invalid regexp ${pattern}`);
          }
        }
        // could not construct regexp
        else {
          throw new Error(`Invalid regexp ${pattern}`);
        }
      }
      // make sure regexp is serialized to its string representation
      if (regex) {
        regex.toJSON = regex.toString;
      }
      return regex;
    }
    return data || schema.const || schema.default;
  }

  static parseNumber(schema, data) {
    return parseInt(typeof data === 'undefined' ? schema.const || schema.default : data, 10);
  }

  static parseBoolean(schema, data) {
    return typeof data === 'undefined' ? schema.const || schema.default : JSON.parse(data);
  }
}

class BasePlugin {
  constructor(opts = {}) {
    this.opts = SchemaHelper.instantiate(this.getOptsSchema(), opts);
  }
}

class ExtractHeadingsPlugin extends BasePlugin {
  getOptsSchema() {
    return {
      title: 'ExtractHeadingsPlugin',
      description: 'responsible for extracting H1-H6 html headings',
      type: 'object',
      properties: {
        domRead: {
          type: 'boolean',
          const: true,
        },
      },
    };
  }

  test(site, resource) {
    // only extract new urls of a currently crawled resource
    if (!resource || !resource.crawlInProgress) return false;

    return resource.mediaType.indexOf('html') !== -1;
  }

  apply(site, resource) {
    const headings = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ].reduce((headings, selector) => headings.concat(
      Array.from(document.querySelectorAll(selector)).map(heading => heading.innerText),
    ), []);

    return {
      content: headings,
    };
  }
}

class ExtractHtmlHeadings {
  getPluginNames() {
    return [
      'SelectResourcePlugin',
      'FetchPlugin',
      'ExtractUrlsPlugin',
      'ExtractHeadingsPlugin',
      'InsertResourcesPlugin',
      'UpsertResourcePlugin',
    ];
  }

  getResultTableHeaders() {
    return [
      {
        label: 'Html Content',
        render: row => JSON.stringify(row.content),
      },
      {
        label: 'URL',
        render: row => (row.url),
      },
    ];
  }

  getResultExportOpts() {
    return [
      {
        type: ExportType.CSV,
        cols: [ 'url', 'content' ],
        fieldSeparator: ',',
        lineSeparator: '\n',
      },
      {
        type: ExportType.ZIP,
        cols: [ 'blob' ],
      },
    ];
  }
}
const embeddedPlugins = {
  ExtractHeadingsPlugin,
};

export default ExtractHtmlHeadings;
// eslint-disable-next-line object-curly-newline
export { embeddedPlugins };
