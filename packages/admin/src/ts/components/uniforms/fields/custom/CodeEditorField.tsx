import React from 'react';
import classnames from 'classnames';
import { wrapField } from 'uniforms-bootstrap4';


const CodeEditorField = props => wrapField(
  props,
  <textarea
    className={classnames(props.inputClassName, 'form-control', { 'is-invalid': props.error })}
    disabled={props.disabled}
    id={props.id}
    name={props.name}
    onChange={event => props.onChange(event.target.value)}
    placeholder={props.placeholder}
    ref={props.inputRef}
    rows={props.rows}
    value={props.value}
  />,
);

export default CodeEditorField;
