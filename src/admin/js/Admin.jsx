import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import queryString from 'query-string';
import Header from './layout/Header';
import Page from './layout/Page';
import ProjectList from './pages/projects/ProjectList';
import ProjectDetail from './pages/projects/ProjectDetail';
import PluginList from './pages/plugins/PluginList';
import PluginDetail from './pages/plugins/PluginDetail';
import LogList from './pages/logs/LogList';
import Help from './pages/help/Help';

export default class Admin extends React.Component {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <Router>
        <div>
          <Header/>
          <Page>
            <Switch>
              <Route path="/site/:siteId?" component={ProjectDetail} />
              <Route path="/sites" component={ProjectList} />

              <Route path="/plugins" component={PluginList} />
              <Route path="/plugin/:pluginId?" component={PluginDetail} />

              <Route path="/logs" component={LogList} />
              <Route path="/help" component={Help} />
              <Route path="/"
                exact={false}
                component={(props) => {
                // redirect to redirectPath param, pass the others to the new location
                const queryParams = queryString.parse(props.location.search);
                const redirectPath = queryParams.redirectPath ? queryParams.redirectPath : '/sites';
                delete queryParams.redirectPath;
                const redirectQueryParams = queryString.stringify(queryParams);
                return <Redirect from="/" to={`${redirectPath}?${redirectQueryParams}`} />;
                }}
              />
            </Switch>
          </Page>
        </div>
      </Router>
    );
  }
}
