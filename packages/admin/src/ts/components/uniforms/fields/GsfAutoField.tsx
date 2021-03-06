import { AutoField, RadioField, DateField, NumField, TextField, LongTextField, BoolField } from 'uniforms-bootstrap4';
import { BaseField } from 'uniforms';
import { createElement } from 'react';
import GsfNestField from './GsfNestField';
import ScenarioDescriptionField from './custom/ScenarioDescriptionField';
import CodeEditorField from './custom/CodeEditorField';
import GsfSelectField from './GsfSelectField';
import ScenarioLinkField from './custom/ScenarioLinkField';
import GsfBoolField from './GsfBoolField';

export default class GsfAutoField extends AutoField {
  static displayName = 'AutoField';
  static contextTypes = BaseField.contextTypes;

  render() {
    const props = this.getFieldProps(this.props.name, { ensureValue: false });

    if (props.component === undefined) {
      if (props.allowedValues) {
        if (props.checkboxes && props.fieldType !== Array) {
          props.component = RadioField;
        }
        else {
          props.component = GsfSelectField;
        }
      }
      else {
        switch (props.fieldType) {
          case Date:
            props.component = DateField;
            break;
          case Number:
            props.component = NumField;
            break;
          case Object:
            props.component = GsfNestField;
            break;
          case String:
            switch (props.customField) {
              case 'LongTextField':
                props.component = LongTextField;
                break;
              case 'ScenarioDescription':
                props.component = ScenarioDescriptionField;
                break;
              case 'ScenarioLink':
                props.component = ScenarioLinkField;
                break;
              case 'CodeEditor':
                props.component = CodeEditorField;
                break;
              default:
                props.component = TextField;
            }
            break;
          case Boolean:
            props.component = GsfBoolField;
            break;
          default:
        }
      }
    }

    if (props.uniforms && props.uniforms.hidden) return null;
    return createElement(props.component, props);
  }

  getFieldProps(name, options) {
    const fieldProps = super.getFieldProps(name, options);
    fieldProps.id = fieldProps.name;
    return fieldProps;
  }
}
