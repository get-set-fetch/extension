import * as React from 'react';
import { setIn } from 'immutable';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import { History } from 'history';
import { match } from 'react-router';
import Plugin from './model/Plugin';

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
    console.log(this.state.plugin)
  }

  async submitHandler(evt) {
    evt.preventDefault();
    console.log("save plugin")
    console.log(this.state.plugin)

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
    <form onSubmit={this.submitHandler}>
      <div className="form-group row">
          <label htmlFor="name" className="col-sm-2 col-form-label">Plugin Name</label>
          <div className="col-sm-10">
            <input
              id="name" type="text" className="form-control"
              value={this.state.plugin.name}
              onChange={this.changeHandler}/>
          </div>
        </div>
      <div className="form-group row">
        <label htmlFor="code" className="col-sm-2 col-form-label">Plugin Code</label>
        <div className="col-sm-10">
          <textarea
            id="code" className="form-control"
            value={this.state.plugin.code}
            onChange={this.changeHandler}/>
        </div>
      </div>
      <button id="save" type="submit" className="btn btn-primary">Save</button>
        <button id="cancel" type="button" className="btn btn-secondary"
          onClick={() => this.props.history.push('/plugins')}>Cancel</button>
    </form>
    );
  }
}
