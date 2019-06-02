declare module 'uniforms' {
  interface IAutoFormProps {
    schema: any;
    onSubmit: any;
    model: any;
    validate: any;
    showInlineError: any;
    validator: any;
    grid: any;
    modelTransform: any;
  }

  interface IAutoFieldProps {
    id?: string;
    name?: string;
    value?: any;
    autoField?: any;
    element?: string;
    omitFields?: any[];
  }

  export class BaseField extends React.Component<IAutoFieldProps, {}> {
    static displayName: string;
    static contextTypes: any;

    getFieldProps(name?, options?): any;
    getChildContextName(): any;
  }
 }