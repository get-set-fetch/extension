import React from 'react';
import classnames from 'classnames';
import { wrapField } from 'uniforms-bootstrap4';
import gsfConnectField from './gsfConnectField';

const xor = (item, array) => {
  const index = array.indexOf(item);
  if (index === -1) {
    return array.concat([ item ]);
  }

  return array.slice(0, index).concat(array.slice(index + 1));
};

const renderCheckboxes = props => props.allowedValues.map(item => (
  <div key={item} className={classnames(props.inputClassName, `checkbox${props.inline ? '-inline' : ''}`)}>
    <label htmlFor={`${props.id}-${item}`}>
      <input
        checked={props.fieldType === Array ? props.value.includes(item) : props.value === item}
        disabled={props.disabled}
        id={`${props.id}-${item}`}
        name={props.name}
        onChange={() => props.onChange(props.fieldType === Array ? xor(item, props.value) : item)}
        type="checkbox"
      />
      {props.transform ? props.transform(item) : item}
    </label>
  </div>
));
const renderSelect = props => (
  <select
    className={classnames(props.inputClassName, 'c-select form-control', { 'is-invalid': props.error })}
    disabled={props.disabled}
    id={props.id}
    name={props.name}
    onChange={event => props.onChange(event.target.value)}
    ref={props.inputRef}
    value={props.value}
  >
    {
      props.customPlaceholder && <option value="">{props.customPlaceholder}</option>
    }

    {props.allowedValues.map((value, idx) => (
      <option key={value} value={value}>
        {props.enumNames[idx]}
      </option>
    ))}
  </select>
);
const Select = props => wrapField(props, props.checkboxes || props.fieldType === Array ? renderCheckboxes(props) : renderSelect(props));
export default gsfConnectField(Select);
