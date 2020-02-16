import createValidation from 'is-my-json-valid';
import GsfBridge from './GsfBridge';


export default class SchemaBridgeHelper {
  static createBridge(schema, data): GsfBridge {
    const validate = createValidation(
      schema,
      {
        greedy: true,
        verbose: true,
        formats: {
          regex: /^\/.+\/i{0,1}$/,
        },
      },
    );

    const schemaValidator = model => {
      validate(model);

      if (validate.errors) {
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

    return new GsfBridge(schema, data, schemaValidator);
  }
}
