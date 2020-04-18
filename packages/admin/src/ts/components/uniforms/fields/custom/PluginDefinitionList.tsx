import React from 'react';
import { wrapField, AutoField } from 'uniforms-bootstrap4';


const PluginDefinitionList = props => {
  // autofield enters an infinite loop
  const prop1 = Object.assign({}, props, { label: 'Description', fieldType: 'String', id: 'pluginDefinitions.0.name', value: 'CustomPluginA' });


  return [
    wrapField(prop1, <AutoField {...prop1} />),
    wrapField(props, <p>AAA2</p>),
  ];
};

export default PluginDefinitionList;
