import React from 'react';

export default class Header extends React.Component {
  render() {
    return (
      <div className="container-fluid">
      <div className="row">
        <main role="main" className="col pt-3 px-4">
          {this.props.children}
        </main>
      </div>
    </div>
    );
  }
}
