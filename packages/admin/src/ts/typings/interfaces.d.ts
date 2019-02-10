interface Window {
  GsfClient: any;
}

declare module "*.png" {
  const value: any;
  export = value;
}
declare module "react-jsonschema-form/lib/utils" {
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
