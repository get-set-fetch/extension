import React from 'react';
import { wrapField } from 'uniforms-bootstrap4';

const ScenarioLinkField = props => wrapField(
  props,
  <a id="scenarioLink" href={props.value} target='_blank' rel="noopener noreferrer" >{props.value}</a>,
);

export default ScenarioLinkField;
