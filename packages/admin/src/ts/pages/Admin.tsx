import * as React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import * as queryString from 'query-string';
import SiteList from './sites/SiteList';
import SiteDetail from './sites/SiteDetail';
import PluginList from './plugins/PluginList';
import PluginDetail from './plugins/PluginDetail';
import LogList from './logs/LogList';
import SettingList from './settings/SettingList';
import Help from './help/Help';
import ProjectList from './projects/ProjectList';
import ScenarioList from './scenarios/ScenarioList';
import ProjectDetail from './projects/ProjectDetail';

import Navigation from '../layout/Navigation';

export default class Admin extends React.Component {
  render() {
    return (
      <Router>
        <div className="row h-100">

          {/* left menu */}
          <div className="col-2">
            <Navigation/>
          </div>

          {/* page content */}
          <div className="col-8 pl-0">
            <div className="card card-main shadow-sm text-primary bg-white h-100">

              <Switch>
                <Route path="/projects" component={ProjectList} />
                <Route path="/project/:projectId?" component={ProjectDetail} />

                <Route path="/site/:siteId?" component={SiteDetail} />
                <Route path="/sites" component={SiteList} />

                <Route path="/scenarios" component={ScenarioList} />

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
                  const redirectPath = queryParams.redirectPath ? queryParams.redirectPath : '/projects';
                  delete queryParams.redirectPath;
                  const redirectQueryParams = queryString.stringify(queryParams);
                  return <Redirect from="/" to={`${redirectPath}?${redirectQueryParams}`} />;
                  }}
                />
              </Switch>

            </div>
          </div>

          {/* right menu */}
          <div className="col-2"></div>

        </div>
      </Router>
    )
  }
}
