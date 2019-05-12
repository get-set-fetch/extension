// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface Window {
  GsfClient;
}

declare module '*.png' {
  const value;
  export = value;
}
declare module 'react-jsonschema-form/lib/utils' {
  const ADDITIONAL_PROPERTY_FLAG: string;

  const isMultiSelect: Function;
  const isSelect: Function;
  const retrieveSchema: Function;
  const toIdSchema: Function;
  const getDefaultRegistry: Function;
  const mergeObjects: Function;
  const getUiOptions: Function;
  const isFilesArray: Function;
  const deepEquals: Function;
  const getSchemaType: Function;
}
