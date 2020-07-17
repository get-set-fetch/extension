import * as React from 'react';
import { HttpMethod, ILog, IExportResult, LogLevel } from 'get-set-fetch-extension-commons';
import Table from '../../components/Table';
import GsfClient from '../../components/GsfClient';
import Page from '../../layout/Page';
import Modal from '../../components/Modal';

interface IState {
  data: ILog[];
}

export default class LogList extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
    };

    this.deleteAllHandler = this.deleteAllHandler.bind(this);
  }

  componentDidMount() {
    this.loadLogs();
  }

  async loadLogs() {
    const data: ILog[] = (await GsfClient.fetch<ILog[]>(HttpMethod.GET, 'logs'));
    this.setState({ data });
  }

  async deleteAllHandler() {
    try {
      await GsfClient.fetch(HttpMethod.DELETE, 'logs');
    }
    catch (err) {
      Modal.instance.show('Delete Logs', <p id="error">{err}</p>);
    }

    this.loadLogs();
  }

  async export(evt: React.MouseEvent<HTMLAnchorElement>) {
    const { currentTarget } = evt;

    // download href has just been set don't recreate it again, allow the browser to naturally follow the download link
    if (currentTarget.hasAttribute('downloadready')) {
      currentTarget.removeAttribute('downloadready');
      return;
    }
    evt.preventDefault();

    try {
      const exportInfo: IExportResult = await GsfClient.fetch(HttpMethod.GET, 'logs/export');

      currentTarget.href = exportInfo.url;
      currentTarget.download = 'get-set-fetch.logs.csv';
      currentTarget.setAttribute('downloadready', 'true');
      currentTarget.click();
    }
    catch (err) {
      Modal.instance.show('Export Logs', <p id="error">{err}</p>);
    }
  }

  async delete(evt: React.MouseEvent<HTMLAnchorElement>) {
    evt.preventDefault();

    try {
      await GsfClient.fetch(HttpMethod.DELETE, 'logs');
    }
    catch (err) {
      Modal.instance.show('Delete Logs', <p id="error">{err}</p>);
    }

    this.loadLogs();
  }

  render() {
    const localeOpts = {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };

    return (
      <Page
        title="Logs"
        actions={[
          <a id='delete' key="delete" className='btn btn-secondary float-right' onClick={evt => this.delete(evt)} href="#">Delete Logs</a>,
          <a id='export' key="export" className='btn btn-secondary float-right mr-2' onClick={evt => this.export(evt)} href="#">Export Logs</a>,
        ]}
      >
        <Table
          header={[
            {
              label: 'Level',
              render: (log: ILog) => LogLevel[log.level],
            },
            {
              label: 'Date',
              render: (log: ILog) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(log.date).toLocaleDateString('en-US', localeOpts)}</span>,
            },
            {
              label: 'Class',
              render: (log: ILog) => log.cls,
            },
            {
              label: 'Message',
              render: (log: ILog) => {
                const msgs = log.msg ? log.msg.map(msg => {
                  // msg is object, usefull for serializing errors
                  if (msg === Object(msg)) {
                    return Object.getOwnPropertyNames(msg).map(propName => msg[propName]).join(' , ');
                  }

                  // arg is literal
                  return msg;
                }) : null;

                return msgs.map((msg, idx) => <span key={idx} style={{ display: 'block' }}>{msg}</span>);
              },
            },
          ]}
          data={this.state.data}
        />
      </Page>
    );
  }
}
