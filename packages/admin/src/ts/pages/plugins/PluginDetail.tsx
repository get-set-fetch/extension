/* eslint-disable no-console */
import * as React from 'react';
import { setIn } from 'immutable';
import { HttpMethod } from 'get-set-fetch-extension-commons';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import PluginSchema from './model/plugin-schema.json';
import Plugin from './model/Plugin';
import Page from '../../layout/Page';
import GsfClient from '../../components/GsfClient';
import GsfForm from '../../components/uniforms/GsfForm';
import SchemaBridgeHelper from '../../components/uniforms/bridge/GsfBridgeHelper';
import GsfBridge from '../../components/uniforms/bridge/GsfBridge';

interface IState {
  bridge: GsfBridge;
  plugin: Plugin;
}

export default class PluginDetail extends React.Component<RouteComponentProps<{pluginId: string}>, IState> {
  static defaultProps = {
    pluginId: null,
  }

  constructor(props) {
    super(props);

    this.state = {
      bridge: SchemaBridgeHelper.createBridge(PluginSchema),
      plugin: null,
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);
  }

  async componentDidMount() {
    const { pluginId } = this.props.match.params;
    let plugin: Plugin;

    // existing plugin
    if (this.props.match.params.pluginId) {
      try {
        const pluginData: object = await GsfClient.fetch(HttpMethod.GET, `plugin/${pluginId}`);
        plugin = new Plugin(pluginData);
      }
      catch (err) {
        console.error('error loading plugin');
      }
    }
    // new plugin
    else {
      plugin = new Plugin();
    }

    this.setState({ plugin });
  }

  changeHandler(key, value) {
    this.setState({ plugin: setIn(this.state.plugin, [ key ], value) });
  }

  async submitHandler() {
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
      console.error('error saving plugin');
    }
  }

  render() {
    if (!this.state.plugin) return null;

    return (
      <Page
        title={this.state.plugin.id ? this.state.plugin.name : 'New Plugin'}
      >
        <GsfForm
          schema={this.state.bridge}
          model={this.state.plugin.toJS()}
          onChange={this.changeHandler}
          onSubmit={this.submitHandler}
          validate="onChangeAfterSubmit"
          showInlineError={true}
          validator={{ clean: true }}
        >
          <div className="form-group">
            <input id="save" className="btn btn-secondary" type="submit" value="Save"/>
            <NavLink id="cancel" to="/plugins" className="btn btn-light ml-4">Cancel</NavLink>
          </div>
        </GsfForm>
      </Page>
    );
  }
}
