import * as React from 'react';
import Table, { IHeaderCol } from '../../components/Table';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import ILog from './model/Log';
import Page from '../../layout/Page';

interface IState {
  header: IHeaderCol[];
  data: ILog[];
}

export default class LogList extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Level',
          render: (log:ILog) => log.level,
        },
        {
          label: 'Date',
          render: (log:ILog) => log.date.toString(),
        },
        {
          label: 'Class',
          render: (log:ILog) => log.cls,
        },
        {
          label: 'Message',
          render: (log:ILog) => (<span style={{ textOverflow: 'ellipsis' }}>{log.msg.substr(0, 100)}</span>),
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
    const data:ILog[] = (await GsfClient.fetch(HttpMethod.GET, 'logs')) as ILog[];
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
    return (
      <Page
        title="Logs"
        >
        <Table
          header={this.state.header}
          data={this.state.data}          
        />
      </Page>
    );
  }
}
