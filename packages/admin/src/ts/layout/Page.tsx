import * as React from 'react';

interface IProps {
  title: string;
  actions?: React.ReactNode[];
}

export default class Page extends React.Component<IProps> {
  render() {
    return ([
      // card header
      <div key="card-header" className="card-header">
        <div className="row">
          <div className="col justify-content-center">
            <h3>{this.props.title}</h3>
          </div>
          <div className="col mr-3">
            {this.props.actions}
          </div>
        </div>
      </div>,

      // card body
      <div key="card-body" className="card-body">
        {this.props.children}
      </div>,
    ]);
  }
}
