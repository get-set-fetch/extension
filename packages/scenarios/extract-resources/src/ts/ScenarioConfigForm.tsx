import * as React from 'react';
import Form from 'react-jsonschema-form';

export default abstract class ScenarioConfigForm extends React.Component<{}, {}> {
  abstract get CONFIG_FORM_SCHEMA(): any;
  abstract get CONFIG_FORM_DEFAULTS(): any;
  abstract configSaveHandler(data: any): void;

  render() {
    return (
      <Form
        schema={this.CONFIG_FORM_SCHEMA}
      />
    );
  }
}