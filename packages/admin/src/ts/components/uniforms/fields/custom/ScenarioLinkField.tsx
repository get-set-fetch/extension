import React from 'react';
import { wrapField } from 'uniforms-bootstrap4';

const ScenarioLinkField = props => wrapField(
  props,
  <p><a href={props.value} target='_blank' rel="noopener noreferrer" >{props.value}</a></p>,
);

export default ScenarioLinkField;
