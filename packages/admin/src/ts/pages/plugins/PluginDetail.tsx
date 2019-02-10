import * as React from 'react';
import { setIn } from 'immutable';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import { History } from 'history';
import { match } from 'react-router';
import Plugin from './model/Plugin';
import Page from '../../layout/Page';
import { NavLink } from 'react-router-dom';

interface IProps {
  pluginId: string;
  history: History;
  match: match<{
    pluginId: string;
  }>
}

interface IState {
  plugin: Plugin;
}

export default class PluginDetail extends React.Component<IProps, IState> {
  static defaultProps = {
    pluginId: null
  }

  constructor(props) {
    super(props);

    this.state = {
      plugin: null
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);
  }

  async componentDidMount() {
    const { pluginId } = this.props.match.params;
    let plugin:Plugin;

    // existing plugin
    if (this.props.match.params.pluginId) {
      try {
        let pluginData:object = await GsfClient.fetch(HttpMethod.GET, `plugin/${pluginId}`);
        plugin = new Plugin(pluginData);
      }
      catch (err) {
        console.log('error loading plugin');
      }
    }
    // new plugin
    else {
      plugin = new Plugin();
    }

    this.setState({ plugin });
  }

  changeHandler(evt) {
    const val = evt.target.value;
    const prop = evt.target.id;
    this.setState({ plugin: setIn(this.state.plugin, [prop], val) });
  }

  async submitHandler(evt) {
    evt.preventDefault();

    try {
      if (this.state.plugin.id) {
        await GsfClient.fetch(HttpMethod.PUT, 'plugin', this.state.plugin);
      }
      else {
        await GsfClient.fetch(HttpMethod.POST, 'plugin', this.state.plugin);
      }
      this.props.history.push('/plugins');
    }
    catch (err) {
      console.log('error saving plugin');
    }
  }

  render() {
    if (!this.state.plugin) return null;

    return (
      <Page
        title={this.state.plugin.name ? this.state.plugin.name : "New Plugin"}
        >
        <form className="form-main" onSubmit={this.submitHandler}>
          <div className="form-group row">
              <label htmlFor="name" className="col-sm-2 col-form-label text-right">Name</label>
              <div className="col-sm-5">
                <input
                  id="name" type="text" className="form-control"
                  value={this.state.plugin.name}
                  onChange={this.changeHandler}/>
              </div>
            </div>
          <div className="form-group row">
            <label htmlFor="code" className="col-sm-2 col-form-label text-right">Source Code</label>
            <div className="col-sm-5">
              <textarea
                id="code" className="form-control"
                value={this.state.plugin.code}
                onChange={this.changeHandler}/>
            </div>
          </div>

          <div className="form-group row">
            <div className="col-sm-2"/>
            <div className="col-sm-5">
              <a id="save" className="btn btn-secondary" href="#" role="button" onClick={this.submitHandler}>Save</a>
              <NavLink id="cancel" to="/plugins" className="btn btn-light ml-4">Cancel</NavLink>
            </div>
          </div>
        </form>
      </Page>
    );
  }
}
