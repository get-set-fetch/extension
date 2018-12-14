import React from 'react';
import PropTypes from 'prop-types';
import { setIn, removeIn } from 'immutable';
import queryString from 'query-string';
import GsfClient from '../../components/GsfClient';
import SiteDetailPlugins from './SiteDetailPlugins';


export default class SiteDetail extends React.Component {
  static get propTypes() {
    return {
      siteId: PropTypes.string,
      history: PropTypes.shape({
        push: PropTypes.func,
      }),
      location: PropTypes.shape({
        search: PropTypes.string,
      }),
      match: PropTypes.shape({
        params: PropTypes.shape({
          pluginId: PropTypes.string,
        }),
      }),
    };
  }

  static get defaultProps() {
    return {
      siteId: '',
      history: {
        push: () => {},
      },
      location: {
        search: '',
      },
      match: {
        params: {
          pluginId: null,
        },
      },
    };
  }

  constructor(props) {
    super(props);

    const queryParams = queryString.parse(props.location.search);

    this.state = {
      site: {
        name: queryParams.name,
        url: queryParams.url,
        pluginDefinitions: [],
        opts: {
          crawl: {
            delay: 200,
            maxResources: -1,
          },
          resourceFilter: {
            maxEntries: 5000,
            probability: 0.01,
          },
        },
      },
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

    if (this.props.match.params.siteId) {
      try {
        const site = await GsfClient.fetch('GET', `site/${siteId}`);
        this.setState({ site });
      }
      catch (err) {
        console.log('error loading site');
      }
    }

    const availablePluginDefinitions = await GsfClient.fetch('GET', 'plugindefs/available');
    this.setState({ availablePluginDefinitions });

    // default plugins for a new site
    if (!this.props.match.params.siteId) {
      const defaultPluginDefinition = await GsfClient.fetch('GET', 'plugindefs/default');
      this.setState({ site: setIn(this.state.site, ['pluginDefinitions'], defaultPluginDefinition) });
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
        await GsfClient.fetch('PUT', 'site', this.state.site);
      }
      else {
        await GsfClient.fetch('POST', 'site', this.state.site);
      }
      this.props.history.push('/sites');
    }
    catch (err) {
      console.log('error saving site');
    }
  }

  addPluginDef(pluginName) {
    const pluginToBeAdded = this.state.availablePluginDefinitions.find(pluginDef => pluginDef.name === pluginName);
    const newPluginDefinitions = this.state.site.pluginDefinitions.concat({
      name: pluginToBeAdded.name,
      opts: pluginToBeAdded.opts,
    });
    this.setState({ site: setIn(this.state.site, ['pluginDefinitions'], newPluginDefinitions) });
  }

  removePluginDef(evt) {
    evt.preventDefault();

    const pluginName = evt.target.getAttribute('data-plugin-name');
    const pluginIdx = this.state.site.pluginDefinitions.findIndex(pluginDef => pluginDef.name === pluginName);

    const newsite = removeIn(this.state.site, ['pluginDefinitions', pluginIdx]);
    console.log(newsite);

    this.setState({ site: newsite });
  }

  changePluginDef(evt) {
    const optKey = evt.target.id;
    const optVal = evt.target.value;
    const pluginName = evt.target.getAttribute('data-plugin-name');
    const pluginIdx = this.state.site.pluginDefinitions.findIndex(pluginDef => pluginDef.name === pluginName);

    this.setState({ site: setIn(this.state.site, ['pluginDefinitions', pluginIdx, 'opts', optKey], optVal) });
  }

  reorderPluginDef(result) {
    // dropped outside the table
    if (!result.destination) {
      return;
    }

    const newPluginDefinitions = this.state.site.pluginDefinitions.slice();
    const [removed] = newPluginDefinitions.splice(result.source.index, 1);
    newPluginDefinitions.splice(result.destination.index, 0, removed);

    this.setState({ site: setIn(this.state.site, ['pluginDefinitions'], newPluginDefinitions) });
  }

  getNotUsedPluginDefinitions() {
    const usedPluginNames = this.state.site.pluginDefinitions.map(pluginDefinition => pluginDefinition.name);
    return this.state.availablePluginDefinitions.filter(pluginDefinition => usedPluginNames.indexOf(pluginDefinition.name) === -1);
  }


  render() {
    const notUsedPluginDefs = this.getNotUsedPluginDefinitions();

    return (
    <form onSubmit={this.submitHandler}>
      <div className="form-group row">
          <label htmlFor="name" className="col-sm-2 col-form-label">Name</label>
          <div className="col-sm-10">
            <input
              id="name" type="text" className="form-control"
              value={this.state.site.name}
              onChange={this.changeHandler.bind(this)}/>
          </div>
        </div>
      <div className="form-group row">
        <label htmlFor="url" className="col-sm-2 col-form-label">URL</label>
        <div className="col-sm-10">
          <input
            id="url" type="text" className="form-control"
            value={this.state.site.url}
            onChange={this.changeHandler.bind(this)}/>
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="url" className="col-sm-2 col-form-label">Crawl Options</label>
      </div>
      <div className="form-group row">
        <label htmlFor="opts.crawl.delay" className="col-sm-2 col-form-label">Delay</label>
        <div className="col-sm-10">
          <input
            id="opts.crawl.delay" type="text" className="form-control"
            value={this.state.site.opts.crawl.delay}
            onChange={this.changeHandler.bind(this)}/>
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="opts.crawl.maxResources" className="col-sm-2 col-form-label">Max Resources</label>
        <div className="col-sm-10">
          <input
            id="opts.crawl.maxResources" type="text" className="form-control"
            value={this.state.site.opts.crawl.maxResources}
            onChange={this.changeHandler.bind(this)}/>
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="url" className="col-sm-2 col-form-label">Resource Storage Options</label>
      </div>
      <div className="form-group row">
        <label htmlFor="opts.resourceFilter.maxEntries" className="col-sm-2 col-form-label">Max Entries</label>
        <div className="col-sm-10">
          <input
            id="opts.resourceFilter.maxEntries" type="text" className="form-control"
            value={this.state.site.opts.resourceFilter.maxEntries}
            onChange={this.changeHandler.bind(this)}/>
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="opts.resourceFilter.probability" className="col-sm-2 col-form-label">Collision Probability</label>
        <div className="col-sm-10">
          <input
            id="opts.resourceFilter.probability" type="text" className="form-control"
            value={this.state.site.opts.resourceFilter.probability}
            onChange={this.changeHandler.bind(this)}/>
        </div>
      </div>
      <div className="form-group row">
        <label className="col-sm-2 col-form-label">Site Plugins</label>
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
      <button
        id="save" type="submit"
        className="btn btn-primary">
        Save
      </button>
      <button
        id="cancel" type="button"
        className="btn btn-secondary"
        onClick={() => this.props.history.push('/sites')}>
        Cancel
      </button>
    </form>
    );
  }
}
