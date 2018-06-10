import React from 'react';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import Header from './layout/Header';
import Page from './layout/Page';
import ProjectList from './pages/projects/ProjectList';
import LogList from './pages/logs/LogList';
import Help from './pages/help/Help';

export default class Admin extends React.Component {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return [
      <Router>
        <div>
          <Header/>
          <Page>
            <Route path="/projects" component={ProjectList} />
            <Route path="/logs" component={LogList} />
            <Route path="/help" component={Help} />
            <Redirect from="/" to="/projects" />
          </Page>
        </div>
      </Router>,
    ];
  }
}
