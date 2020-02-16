import React from 'react';
import classnames from 'classnames';
import { wrapField } from 'uniforms-bootstrap4';
import gsfConnectField from './gsfConnectField';

const allowedValues = [ true, false ];

const renderBool = props => (
  <select
    className={classnames(props.inputClassName, 'c-select form-control', { 'is-invalid': props.error })}
    disabled={props.disabled}
    id={props.id}
    name={props.name}
    onChange={event => props.onChange(event.target.value)}
    ref={props.inputRef}
    value={props.value.toString()}
  >
    {
      props.ui && props.ui.placeholder && <option value="">{props.ui.placeholder}</option>
    }

    {allowedValues.map(value => (
      <option key={value.toString()} value={value.toString()}>
        {value.toString()}
      </option>
    ))}
  </select>
);
const Select = props => wrapField(props, renderBool(props));
export default gsfConnectField(Select);
