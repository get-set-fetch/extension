import React from 'react';
import { wrapField } from 'uniforms-bootstrap4';

const ScenarioDescriptionField = props => wrapField(
  props,
  <React.Fragment>{props.value}</React.Fragment>,
);

export default ScenarioDescriptionField;
