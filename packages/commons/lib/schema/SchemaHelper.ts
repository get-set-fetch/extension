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
        if (!pattern) return null;

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
