import * as React from 'react';
import Table from '../../components/Table';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import Log from './model/Log';

interface IState {
  header: any[];
  data: Log[];
}

export default class LogList extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Level',
          render: (log:Log) => (<td>{log.level}</td>),
        },
        {
          label: 'Date',
          render: (log:Log) => (<td>{log.date.toString()}</td>),
        },
        {
          label: 'Class',
          render: (log:Log) => (<td>{log.cls}</td>),
        },
        {
          label: 'Message',
          render: (log:Log) => (<td><span style={{ textOverflow: 'ellipsis' }}>{log.msg.substr(0, 100)}</span></td>),
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
    const data:Log[] = (await GsfClient.fetch(HttpMethod.GET, 'logs')) as Log[];
    console.log(data);
    this.setState({ data });
  }

  async deleteAllHandler() {
    try {
      // remove plugins
      await GsfClient.fetch(HttpMethod.DELETE, 'logs');
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
