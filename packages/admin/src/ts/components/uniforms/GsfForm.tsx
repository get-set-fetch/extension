import * as React from 'react';
import { AutoForm } from 'uniforms-bootstrap4';
import GsfAutoField from './fields/GsfAutoField';

export default class GsfForm extends AutoForm {
  getNativeFormProps() {
    const {
      ...props
    } = super.getNativeFormProps();

    props.children = this.getChildContextSchema()
      .getSubfields()
      .map(key => <GsfAutoField key={key} name={key} />)
      .concat(this.props.children);

    props.className = 'form-main';

    return props;
  }

  getChildContext() {
    const uniforms = super.getChildContext();
    return uniforms;
  }

  getAutoField() {
    return GsfAutoField;
  }

  render() {
    return super.render();
  }
}
