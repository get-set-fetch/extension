/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'uniforms-bootstrap4' {
  import * as React from 'react';

  interface IAutoFormProps {
    schema: any;
    onSubmit: any;
    onChange?: any;
    model: any;
    validate: any;
    showInlineError: any;
    validator: any;
    grid?: any;
    modelTransform?: any;
  }

  interface IAutoFieldProps {
    id?: string;
    name?: string;
    value?: any;
    autoField?: any;
    element?: string;
    omitFields?: any[];
  }

  export class AutoForm extends React.Component<IAutoFormProps, {}> {
    getChildContext(): any;
    getNativeFormProps(): any;
    getSubmitField(): any;
    getChildContextSchema(): any;
  }


  export class AutoField extends React.Component<IAutoFieldProps, {}> {
    constructor(props:IAutoFieldProps, uniforms);
    getFieldProps(name, options): any;
  }

  export class RadioField extends React.Component<IAutoFieldProps, {}> {
    getFieldProps(name, options): any;
  }

  export class SelectField extends React.Component<IAutoFieldProps, {}> {
    getFieldProps(name, options): any;
  }

  export class DateField extends React.Component<IAutoFieldProps, {}> {
    getFieldProps(name, options): any;
  }

  export class ListField extends React.Component<IAutoFieldProps, {}> {
    getFieldProps(name, options): any;
  }

  export class NumField extends React.Component<IAutoFieldProps, {}> {
    getFieldProps(name, options): any;
  }

  export class NestField extends React.Component<IAutoFieldProps, {}> {
    getFieldProps(name, options): any;
  }

  export class TextField extends React.Component<IAutoFieldProps, {}> {
    getFieldProps(name, options): any;
  }

  export class LongTextField extends React.Component<IAutoFieldProps, {}> {
    getFieldProps(name, options): any;
  }

  export class BoolField extends React.Component<IAutoFieldProps, {}> {
    getFieldProps(name, options): any;
  }

  export class BaseField extends React.Component<IAutoFieldProps, {}> {
    static displayName: string;

    getFieldProps(name?, options?): any;
    getChildContextName(): any;
  }

  export function wrapField(props: any, elm: any): any;

  export class SubmitField extends React.Component<IAutoFieldProps, {}> {
    getFieldProps(name, options): any;
  }


}
