import * as React from 'react';

import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import * as queryString from 'query-string';
import SiteList from './sites/SiteList';
import SiteDetail from './sites/SiteDetail';
import PluginList from './plugins/PluginList';
import PluginDetail from './plugins/PluginDetail';
import LogList from './logs/LogList';
import SettingList from './settings/SettingList';
import ProjectList from './projects/ProjectList';
import ScenarioList from './scenarios/ScenarioList';
import ProjectDetail from './projects/ProjectDetail';

import Navigation from '../layout/Navigation';
import ProjectResults from './projects/ProjectResults';
import GettingStarted from './start/GettingStarted';
import Modal from '../components/Modal';

export default class Admin extends React.Component {
  render() {
    return [
      <Router key="router">
        <div className='row h-100'>

          {/* left menu */}
          <div className='col-2 col-xl-2'>
            <Navigation/>
          </div>

          {/* page content */}
          <div className='col-10 col-xl-9 pl-0'>
            <div className='card card-main shadow-sm text-primary bg-white'>

              <Switch>
                <Route path='/projects' component={ProjectList} />
                <Route path='/project/:projectIdOrHash?' exact={true} component={ProjectDetail} />
                <Route path='/project/:projectId?/results' exact={true} component={ProjectResults} />

                <Route path='/site/:siteId?' component={SiteDetail} />
                <Route path='/sites' component={SiteList} />

                <Route path='/scenarios' component={ScenarioList} />

                <Route path='/plugins' component={PluginList} />
                <Route path='/plugin/:pluginId?' component={PluginDetail} />

                <Route path='/logs' component={LogList} />
                <Route path='/settings' component={SettingList} />

                <Route path='/start' component={GettingStarted} />

                <Route path='/'
                  exact={false}
                  component={props => {
                    // redirect to redirectPath param, pass the others to the new location
                    const queryParams = queryString.parse(props.location.search);
                    const redirectPath = queryParams.redirectPath ? queryParams.redirectPath : '/start';
                    const redirectQueryParams = queryString.stringify(Object.assign(queryParams, { redirectPath: null }));
                    return <Redirect from='/' to={`${redirectPath}?${redirectQueryParams}`} />;
                  }}
                />
              </Switch>

            </div>
          </div>

          {/* right menu */}
          <div className='col-0 col-xl-1'></div>

        </div>
      </Router>,
      <Modal key="modal"/>,
    ];
  }
}
