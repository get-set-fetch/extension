import * as React from 'react';
import Form from 'react-jsonschema-form';
import ExtractResources from '../src/ts/ExtractResources';
import BaseInput from './b4/widgets/BaseInput';
import SchemaField from './b4/SchemaField';
import ScenarioDescription from './b4/widgets/ScenarioDescription';
import ScenarioLink from './b4/widgets/ScenarioLink';

interface IState {
  scenarioInstance: ExtractResources;
}

export default class ScenarioConfigForm extends React.Component<{}, IState> {
  form: any;

  constructor(props) {
    super(props);
    this.state = {
      scenarioInstance: new ExtractResources()
    };

    this.clickSubmit = this.clickSubmit.bind(this);
  }

  clickSubmit() {
    const { errors } = this.form.validate(this.form.state.formData);

    if (errors.length === 0) {
      console.log(this.form.state.formData);
    }
  }

  validate(formData, errors) {
    // errors.fieldA.addError('fieldA invalid');
    return errors;
  }

render() {
  return (
      <Form
        ref={(form) => this.form = form}
        fields={{ SchemaField }}
        widgets={{ BaseInput, ScenarioDescription, ScenarioLink }}

        liveValidate={true}
        validate={this.validate}
        showErrorList={false}

        schema={this.state.scenarioInstance.getConfigFormSchema()}
        uiSchema={this.state.scenarioInstance.getConfigFormUISchema()}
      >
        <button className='btn btn-primary' onClick={this.clickSubmit}>Save</button>
      </Form>
    );
  }
}