import React from 'react';
import Table from '../../components/Table';
import GsfClient from '../../components/GsfClient';

export default class LogList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Level',
          render: log => (<td>{log.level}</td>),
        },
        {
          label: 'Date',
          render: log => (<td>{log.date.toString()}</td>),
        },
        {
          label: 'Class',
          render: log => (<td>{log.cls}</td>),
        },
        {
          label: 'Message',
          render: log => (<td><span style={{ 'text-overflow': 'ellipsis' }}>{log.msg.substr(0, 100)}</span></td>),
        },
      ],
      data: [],
    };

    this.deleteAllHandler = this.deleteAllHandler.bind(this);
  }

  componentDidMount() {
    this.loadLogs();
  }

  async loadLogs() {
    const data = await GsfClient.fetch('GET', 'logs');
    console.log(data);
    this.setState({ data });
  }

  async deleteAllHandler() {
    try {
      // remove plugins
      await GsfClient.fetch('DELETE', 'logs');
    }
    catch (err) {
      console.log('error deleting logs');
    }

    this.loadLogs();
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return [
      <p key="title">Log List</p>,
      <input key="del" id="delete" type="button" value="Delete All" onClick={this.deleteAllHandler}/>,
      <Table key="listTable" header={this.state.header} data={this.state.data} />,
    ];
  }
}
