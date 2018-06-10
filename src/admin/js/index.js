import React from 'react';
import ReactDOM from 'react-dom';
import Admin from './Admin';
import '../scss/admin.scss';

ReactDOM.render(
  React.createElement(Admin, {}, null),
  document.getElementById('gsf'),
);
