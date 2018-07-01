import React from 'react';
import ReactDOM from 'react-dom';
import Admin from './Admin';
import GsfClient from './components/GsfClient';
import '../scss/admin.scss';

// register GsfClient at window level, usefull for querying the extension IndexedDB via puppeteer
window.GsfClient = GsfClient;

ReactDOM.render(
  React.createElement(Admin, {}, null),
  document.getElementById('gsf'),
);
