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
        Object.keys(schema.properties).forEach((propKey) => {
            inst[propKey] = this.instantiate(schema.properties[propKey], data[propKey]);
        });
        return inst;
    }
    static parseString(schema, data) {
        if (schema.subType === 'regexp') {
            let regexp = null;
            // provided value for instantiation is already a regexp
            if (data instanceof RegExp) {
                regexp = data;
            }
            // try to extract an regexp from the provided value with fallback to schema default string value
            else {
                const pattern = data || schema.default;
                // no pattern to construct
                if (!pattern)
                    return null;
                const patternAndFlags = pattern.match(/^\/(.+)\/([gim]*)$/);
                // valid regexp identified
                if (patternAndFlags) {
                    regexp = new RegExp(patternAndFlags[1], patternAndFlags[2]);
                }
            }
            // make sure regexp is serialized to its string representation
            if (regexp) {
                regexp.toJSON = regexp.toString;
            }
            return regexp;
        }
        return data || schema.default;
    }
    static parseNumber(schema, data) {
        return parseInt(data || schema.default, 10);
    }
    static parseBoolean(schema, data) {
        return (data || schema.default) === true;
    }
}

var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["POST"] = "POST";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["DELETE"] = "DELETE";
})(HttpMethod || (HttpMethod = {}));
var ExportType;
(function (ExportType) {
    ExportType["CSV"] = "csv";
    ExportType["ZIP"] = "zip";
})(ExportType || (ExportType = {}));

var ConfigFormSchema = {
    type: 'object',
    required: [],
    properties: {
    }
};

var ConfigFormUISchema = {
    'ui:order': []
};

class ExtractHeadingsPlugin {
    constructor(opts) {
        this.opts = SchemaHelper.instantiate(ExtractHeadingsPlugin.OPTS_SCHEMA, opts);
    }
    static get OPTS_SCHEMA() {
        return {
            $id: 'https://getsetfetch.org/html-headings-plugin.schema.json',
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'ExtractHeadingsPlugin',
            type: 'object',
            properties: {
                runInTab: {
                    type: 'boolean',
                    default: true
                }
            }
        };
    }
    test(resource) {
        return resource.mediaType.indexOf('html') !== -1;
    }
    apply(site, resource) {
		const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].reduce((headings, selector) => {
		  return headings.concat(
			Array.from(document.querySelectorAll(selector)).map(heading => heading.innerText)
		  );
		}, []);
			
        return {
            info : {
              content: headings
            }
        };
    }
}

class ExtractHtmlHeadings {
    getConfigFormSchema() {
        return ConfigFormSchema;
    }
    getConfigFormUISchema() {
        return ConfigFormUISchema;
    }
    getPluginDefinitions(scenarioProps) {
        const pluginDefinitions = [
            {
                name: 'SelectResourcePlugin'
            },
            {
                name: 'FetchPlugin'
            },
            {
                name: 'ExtractUrlsPlugin',
            },
            {
                name: 'ExtractHeadingsPlugin'
            },
            {
                name: 'UpdateResourcePlugin'
            },
            {
                name: 'InsertResourcesPlugin'
            }
        ];
        return pluginDefinitions;
    }
    getResultTableHeaders() {
        return [
            {
                label: 'Headings',
                render: (row) => (row.info ? row.info.content : '')
            },
            {
                label: 'URL',
                render: (row) => (row.url)
            }
        ];
    }
    getResultExportOpts() {
        return [
            {
                type: ExportType.CSV,
                cols: ['url', 'info.content'],
                fieldSeparator: ',',
                lineSeparator: '\n'
            }
        ];
    }
}
const embeddedPlugins = {
    ExtractHeadingsPlugin
};

export default ExtractHtmlHeadings;
export { embeddedPlugins };
