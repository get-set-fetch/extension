import * as React from 'react';
import { setIn, removeIn } from 'immutable';
import * as queryString from 'query-string';
import { HttpMethod, IPluginDefinition } from 'get-set-fetch-extension-commons';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import GsfClient from '../../components/GsfClient';
import SiteDetailPlugins from './SiteDetailPlugins';
import Site from './model/Site';
import Page from '../../layout/Page';

interface IState {
  site: Site;
  availablePluginDefinitions: IPluginDefinition[];
}

export default class SiteDetail extends React.Component<RouteComponentProps<{siteId: string}>, IState> {
  constructor(props) {
    super(props);
    this.state = {
      site: null,
      availablePluginDefinitions: [],
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);
    this.reorderPluginDef = this.reorderPluginDef.bind(this);
    this.changePluginDef = this.changePluginDef.bind(this);
    this.getNotUsedPluginDefinitions = this.getNotUsedPluginDefinitions.bind(this);
    this.addPluginDef = this.addPluginDef.bind(this);
    this.removePluginDef = this.removePluginDef.bind(this);
  }

  async componentDidMount() {
    const { siteId } = this.props.match.params;
    let site: Site;

    // existing site
    if (this.props.match.params.siteId) {
      try {
        const data = await GsfClient.fetch(HttpMethod.GET, `site/${siteId}`);
        site = new Site(data);
      }
      catch (err) {
        console.error('error loading site');
      }
    }
    // new site
    else {
      const queryParams = queryString.parse(this.props.location.search);
      site = new Site({
        name: queryParams.name as string,
        url: queryParams.url as string,
      });
    }
    this.setState({ site });

    const availablePluginDefinitions: IPluginDefinition[] = await GsfClient.fetch<IPluginDefinition[]>(HttpMethod.GET, 'plugindefs/available');
    this.setState({ availablePluginDefinitions });

    // default plugins for a new site
    if (!this.props.match.params.siteId) {
      const defaultPluginDefinition = await GsfClient.fetch(HttpMethod.GET, 'plugindefs/default');
      this.setState({ site: setIn(this.state.site, [ 'pluginDefinitions' ], defaultPluginDefinition) });
    }
  }

  changeHandler(evt) {
    const val = evt.target.value;
    const prop = evt.target.id.split('.');
    this.setState({ site: setIn(this.state.site, prop, val) });
  }

  async submitHandler(evt) {
    evt.preventDefault();

    try {
      if (this.state.site.id) {
        await GsfClient.fetch(HttpMethod.PUT, 'site', this.state.site);
      }
      else {
        await GsfClient.fetch(HttpMethod.POST, 'site', this.state.site);
      }
      this.props.history.push('/sites');
    }
    catch (err) {
      console.error('error saving site');
    }
  }

  addPluginDef(pluginName) {
    const pluginToBeAdded = this.state.availablePluginDefinitions.find(pluginDef => pluginDef.name === pluginName);
    const newPluginDefinitions = this.state.site.pluginDefinitions.concat({
      name: pluginToBeAdded.name,
      opts: pluginToBeAdded.opts,
    });
    this.setState({ site: setIn(this.state.site, [ 'pluginDefinitions' ], newPluginDefinitions) });
  }

  removePluginDef(evt) {
    evt.preventDefault();

    const pluginName = evt.target.getAttribute('data-plugin-name');
    const pluginIdx = this.state.site.pluginDefinitions.findIndex(pluginDef => pluginDef.name === pluginName);

    const newsite = removeIn(this.state.site, [ 'pluginDefinitions', pluginIdx ]);
    this.setState({ site: newsite });
  }

  changePluginDef(evt) {
    const optKey = evt.target.id;
    const optVal = evt.target.value;
    const pluginName = evt.target.getAttribute('data-plugin-name');
    const pluginIdx = this.state.site.pluginDefinitions.findIndex(pluginDef => pluginDef.name === pluginName);

    this.setState({ site: setIn(this.state.site, [ 'pluginDefinitions', pluginIdx, 'opts', optKey ], optVal) });
  }

  reorderPluginDef(result) {
    // dropped outside the table
    if (!result.destination) {
      return;
    }

    const newPluginDefinitions = this.state.site.pluginDefinitions.slice();
    const [ removed ] = newPluginDefinitions.splice(result.source.index, 1);
    newPluginDefinitions.splice(result.destination.index, 0, removed);

    this.setState({ site: setIn(this.state.site, [ 'pluginDefinitions' ], newPluginDefinitions) });
  }

  getNotUsedPluginDefinitions() {
    const usedPluginNames = this.state.site.pluginDefinitions.map(pluginDefinition => pluginDefinition.name);
    return this.state.availablePluginDefinitions.filter(pluginDefinition => usedPluginNames.indexOf(pluginDefinition.name) === -1);
  }


  render() {
    if (!this.state.site) return null;

    const notUsedPluginDefs = this.getNotUsedPluginDefinitions();

    return (
      <Page
        title={this.state.site.id ? this.state.site.name : 'New Site'}
      >
        <form className="form-main">
          <div className="form-group row">
            <label htmlFor="name" className="col-sm-2 col-form-label text-right">Name</label>
            <div className="col-sm-5">
              <input
                id="name" type="text" className="form-control"
                value={this.state.site.name}
                onChange={this.changeHandler.bind(this)}/>
            </div>
          </div>
          <div className="form-group row">
            <label htmlFor="url" className="col-sm-2 col-form-label text-right">URL</label>
            <div className="col-sm-5">
              <input
                id="url" type="text" className="form-control"
                value={this.state.site.url}
                onChange={this.changeHandler.bind(this)}/>
            </div>
          </div>
          <div className="form-group row">
            <label htmlFor="url" className="col-sm-2 col-form-label text-right">Crawl Options</label>
          </div>
          <div className="form-group row">
            <label htmlFor="opts.crawl.delay" className="col-sm-2 col-form-label text-right">Delay</label>
            <div className="col-sm-5">
              <input
                id="opts.crawl.delay" type="text" className="form-control"
                value={this.state.site.opts.crawl.delay}
                onChange={this.changeHandler.bind(this)}/>
            </div>
          </div>
          <div className="form-group row">
            <label htmlFor="opts.crawl.maxResources" className="col-sm-2 col-form-label text-right">Max Resources</label>
            <div className="col-sm-5">
              <input
                id="opts.crawl.maxResources" type="text" className="form-control"
                value={this.state.site.opts.crawl.maxResources}
                onChange={this.changeHandler.bind(this)}/>
            </div>
          </div>
          <div className="form-group row">
            <label htmlFor="url" className="col-sm-2 col-form-label text-right">Resource Storage Options</label>
          </div>
          <div className="form-group row">
            <label htmlFor="opts.resourceFilter.maxEntries" className="col-sm-2 col-form-label text-right">Max Entries</label>
            <div className="col-sm-5">
              <input
                id="opts.resourceFilter.maxEntries" type="text" className="form-control"
                value={this.state.site.opts.resourceFilter.maxEntries}
                onChange={this.changeHandler.bind(this)}/>
            </div>
          </div>
          <div className="form-group row">
            <label htmlFor="opts.resourceFilter.probability" className="col-sm-2 col-form-label text-right">Collision Probability</label>
            <div className="col-sm-5">
              <input
                id="opts.resourceFilter.probability" type="text" className="form-control"
                value={this.state.site.opts.resourceFilter.probability}
                onChange={this.changeHandler.bind(this)}/>
            </div>
          </div>
          <div className="form-group row">
            <label className="col-sm-2 col-form-label text-right">Site Plugins</label>
            <div className="col-sm-10">
              <SiteDetailPlugins
                pluginDefinitions={this.state.site.pluginDefinitions}
                reorderPluginDef={this.reorderPluginDef}
                changePluginDef={this.changePluginDef}
                removePluginDef={this.removePluginDef}
              />

              <div className="row" key="ctrl">
                <div className="btn-group">
                  <button
                    type="button" className="btn btn-primary dropdown-toggle"
                    data-toggle="dropdown"
                    aria-haspopup="true" aria-expanded="false"
                    disabled={notUsedPluginDefs.length === 0}>
                      Add Plugin
                  </button>
                  <div className="dropdown-menu">
                    {
                      notUsedPluginDefs.map(pluginDef => (
                        <a key={pluginDef.name} className="dropdown-item" href="#" onClick={() => this.addPluginDef(pluginDef.name)}>
                          {pluginDef.name}
                        </a>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group row">
            <div className="col-sm-2"/>
            <div className="col-sm-5">
              <a id="save" className="btn btn-secondary" href="#" role="button" onClick={this.submitHandler}>Save</a>
              <NavLink id="cancel" to="/sites" className="btn btn-light ml-4">Cancel</NavLink>
            </div>
          </div>
        </form>
      </Page>
    );
  }
}
