import * as React from 'react';
import { NavLink } from 'react-router-dom';
import Table from '../../components/Table';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import Plugin from './model/Plugin';

interface IState {
  header: any[];
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
          render: (plugin:Plugin) => (<td><NavLink to={`/plugin/${plugin.id}`} className="nav-link">{plugin.name}</NavLink></td>),
        },
        {
          label: 'Code',
          render: (plugin:Plugin) => (<td><span style={{ textOverflow: 'ellipsis' }}>{plugin.code.substr(0, 100)}</span></td>),
        },
      ],
      data: [],
      selectedRows: [],
    };

    this.deleteHandler = this.deleteHandler.bind(this);
    this.onHeaderSelectionChange = this.onHeaderSelectionChange.bind(this);
    this.onRowSelectionChange = this.onRowSelectionChange.bind(this);
  }

  componentDidMount() {
    this.loadPlugins();
  }

  async loadPlugins() {
    const data:Plugin[] = (await GsfClient.fetch(HttpMethod.GET, 'plugins')) as Plugin[];
    this.setState({ data });
  }

  async deleteHandler() {
    // no plugin(s) selected for deletion
    if (this.state.selectedRows.length === 0) return;

    // retrieve ids for the plugins to be deleted
    const deleteIds = this.state.selectedRows.map(selectedRow => this.state.data[selectedRow].id);

    try {
      // remove plugins
      await GsfClient.fetch(HttpMethod.DELETE, 'plugins', { ids: deleteIds });

      // clear row selection
      this.setState({ selectedRows: [] });
    }
    catch (err) {
      console.log('error deleting plugins');
    }

    this.loadPlugins();
  }

  onRowSelectionChange(toggleRow) {
    const newSelectedRows = Table.toggleSelection(this.state.selectedRows, toggleRow);
    this.setState({ selectedRows: newSelectedRows });
  }

  onHeaderSelectionChange(evt) {
    if (evt.target.checked) {
      this.setState({ selectedRows: Array<number>(this.state.data.length).fill(1).map((elm, idx) => idx) });
    }
    else {
      this.setState({ selectedRows: [] });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return [
      <NavLink id="newplugin" key="new" to="/plugin/" className="nav-link">Create new user plugin</NavLink>,
      <p key="title">Plugin List</p>,
      <input key="del" id="delete" type="button" value="Delete" onClick={this.deleteHandler}/>,
      <Table key="listTable"
        header={this.state.header} data={this.state.data}
        onRowSelectionChange={this.onRowSelectionChange} onHeaderSelectionChange={this.onHeaderSelectionChange}
        selectedRows={this.state.selectedRows} />,
    ];
  }
}
