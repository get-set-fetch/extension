export class SchemaHelper {
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
      Object.keys(schema.properties).forEach((propKey) => {
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
