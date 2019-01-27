import * as React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import * as queryString from 'query-string';
import Header from './layout/Header';
import Page from './layout/Page';
import SiteList from './pages/sites/SiteList';
import SiteDetail from './pages/sites/SiteDetail';
import PluginList from './pages/plugins/PluginList';
import PluginDetail from './pages/plugins/PluginDetail';
import LogList from './pages/logs/LogList';
import SettingList from './pages/settings/SettingList';
import Help from './pages/help/Help';
import ProjectList from './pages/projects/ProjectList';
import ScenarioList from './pages/scenarios/ScenarioList';

export default class Admin extends React.Component {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <Router>
        <div>
          <Header/>
          <Page>
            <Switch>
              <Route path="/site/:siteId?" component={SiteDetail} />
              <Route path="/sites" component={SiteList} />

              <Route path="/projects" component={ProjectList} />
              <Route path="/project/:projectId?" component={ProjectList} />

              <Route path="/plugins" component={PluginList} />
              <Route path="/plugin/:pluginId?" component={PluginDetail} />

              <Route path="/logs" component={LogList} />

              <Route path="/settings" component={SettingList} />

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
