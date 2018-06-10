import React from 'react';

export default class Header extends React.Component {
  render() {
    return (
      <div className="container-fluid">
      <div className="row">
        <main role="main" className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
          {this.props.children}
        </main>
      </div>
    </div>
    );
  }
}
