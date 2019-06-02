import isMyJsonValid from 'is-my-json-valid';
import GsfBridge from './GsfBridge';


export default class SchemaBridgeHelper {
  static createBridge(schema): GsfBridge {
    const validate = isMyJsonValid(schema);

    const schemaValidator = model => {
      validate(model);

      if (validate.errors) {
        // eslint-disable-next-line no-console
        console.log(validate.errors);

        validate.errors.forEach(error => {
          if (error.message === 'is the wrong type') {
            // eslint-disable-next-line no-param-reassign
            error.message = 'is required';
          }
        });
        // eslint-disable-next-line no-throw-literal
        throw { details: validate.errors };
      }
    };

    return new GsfBridge(schema, schemaValidator);
  }
}
