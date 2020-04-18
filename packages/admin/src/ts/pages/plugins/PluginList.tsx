import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { HttpMethod, IPluginStorage } from 'get-set-fetch-extension-commons';
import Table from '../../components/Table';
import GsfClient from '../../components/GsfClient';
import Page from '../../layout/Page';

interface IState {
  data: IPluginStorage[];
  selectedRows: number[];
}

export default class PluginList extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      selectedRows: [],
    };

    this.deletePlugin = this.deletePlugin.bind(this);
  }

  componentDidMount() {
    this.loadPlugins();
  }

  async loadPlugins() {
    const data: IPluginStorage[] = await GsfClient.fetch<IPluginStorage[]>(HttpMethod.GET, 'plugins');
    this.setState({ data });
  }

  async deletePlugin(plugin: IPluginStorage) {
    try {
      // remove plugins
      await GsfClient.fetch(HttpMethod.DELETE, 'plugins', { ids: [ plugin.id ] });

      // clear row selection
      this.setState({ selectedRows: [] });
    }
    catch (err) {
      console.error('error deleting plugins');
    }

    this.loadPlugins();
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <Page
        title='Available Plugins'
        actions={[
          <NavLink key='newplugin' id='newplugin' to='/plugin/' className='btn btn-secondary float-right'>New Plugin</NavLink>,
        ]}
      >
        <Table
          header={[
            {
              label: 'Name',
              render: (plugin: IPluginStorage) => plugin.name,
            },
            {
              label: 'Code',
              render: (plugin: IPluginStorage) => (
                <span style={{ textOverflow: 'ellipsis' }}>
                  {!plugin.scenarioId ? plugin.code.substr(0, 100) : 'embedded plugin'}
                </span>
              ),
            },
            {
              label: 'Actions',
              renderLink: false,
              render: (plugin: IPluginStorage) => ([
                <input
                  key={`delete-${plugin.id}`}
                  id={`delete-${plugin.id}`}
                  type='button'
                  className='btn-secondary'
                  value='Delete'
                  onClick={() => this.deletePlugin(plugin)}
                />,
              ]),
            },
          ]}
          rowLink={this.rowLink}
          data={this.state.data}
        />
      </Page>
    );
  }

  rowLink(row: IPluginStorage) {
    return `/plugin/${row.id}`;
  }
}
