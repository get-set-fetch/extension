import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {HttpMethod} from 'get-set-fetch-extension-commons';
import Table, { IHeaderCol } from '../../components/Table';
import GsfClient from '../../components/GsfClient';
import Plugin from './model/Plugin';
import Page from '../../layout/Page';

interface IState {
  header: IHeaderCol[];
  data: Plugin[];
  selectedRows: number[];
}

export default class PluginList extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Name',
          render: (plugin:Plugin) => plugin.name,
        },
        {
          label: 'Code',
          render: (plugin:Plugin) => (<span style={{ textOverflow: 'ellipsis' }}>{plugin.code.substr(0, 100)}</span>),
        },
        {
          label: 'Actions',
          renderLink: false,
          render: (plugin:Plugin) => ([
              <input
                id={`delete-${plugin.id}`}
                type="button"
                className="btn-secondary"
                value="Delete"
                onClick={evt => this.deletePlugin(plugin)}
              />,
          ]),
        },
      ],
      data: [],
      selectedRows: [],
    };

    this.deletePlugin = this.deletePlugin.bind(this);
  }

  componentDidMount() {
    this.loadPlugins();
  }

  async loadPlugins() {
    const data:Plugin[] = (await GsfClient.fetch(HttpMethod.GET, 'plugins')) as Plugin[];
    this.setState({ data });
  }

  async deletePlugin(plugin:Plugin) {
    try {
      // remove plugins
      await GsfClient.fetch(HttpMethod.DELETE, 'plugins', { ids: [plugin.id] });

      // clear row selection
      this.setState({ selectedRows: [] });
    }
    catch (err) {
      console.log('error deleting plugins');
    }

    this.loadPlugins();
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <Page
        title="Available Plugins"
        actions={[
          <NavLink id="newplugin" to="/plugin/" className="btn btn-secondary float-right">New Plugin</NavLink>
        ]}
        >
        <Table
          header={this.state.header}
          rowLink={this.rowLink}
          data={this.state.data}                 
        />
      </Page>
    );
  }

  rowLink(row:Plugin) {
    return `/plugin/${row.id}`;
  }
}
