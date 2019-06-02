import React from 'react';
import { wrapField } from 'uniforms-bootstrap4';

const ScenarioDescriptionField = props => wrapField(
  props,
  <p>{props.value}</p>,
);

export default ScenarioDescriptionField;
