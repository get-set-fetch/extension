import React from 'react';
import classnames from 'classnames';
import filterDOMProps from 'uniforms/filterDOMProps';
import injectName from 'uniforms/injectName';
import joinName from 'uniforms/joinName';
import GsfAutoField from './GsfAutoField';
import gsfConnectField from './gsfConnectField';

const GsfNest = ({
  children,
  className,
  error,
  errorMessage,
  fields,
  itemProps,
  label,
  name,
  showInlineError,
  ...props
}) => {
  if (props.childrenOnly) {
    return children
      ? injectName(name, children)
      : fields.map(key => <GsfAutoField key={key} name={joinName(name, key)} {...itemProps} />);
  }

  const title = props.field.title ? props.field.title : label;

  return (
    <div className={classnames(className, { 'has-error': error })}>
      <hr/>
      {title && <h4 className="title">{title}</h4>}
      {props.field.uniforms.help && <p>{props.field.uniforms.help}</p>}

      {!!(error && showInlineError) && <span className="text-danger">{errorMessage}</span>}

      {children
        ? injectName(name, children)
        : fields.map(key => <GsfAutoField key={key} name={joinName(name, key)} {...itemProps} />)}
    </div>
  );
};

export default gsfConnectField(GsfNest, { ensureValue: false, includeInChain: false });
