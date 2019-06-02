import { createElement } from 'react';
import GsfAutoField from './GsfAutoField';

const GsfAutoFields = (
  { autoField = GsfAutoField, element = 'div', fields = null, omitFields = [], ...props },
  { uniforms: { schema } },
) => createElement(
  element,
  props,
  (fields || schema.getSubfields())
    .filter(field => omitFields.indexOf(field) === -1)
    .map(field => createElement(autoField, { key: field, name: field })),
);

export default GsfAutoFields;
