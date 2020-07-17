import * as React from 'react';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import { HttpMethod, IHeaderCol, IProjectConfigHash, IProjectStorage } from 'get-set-fetch-extension-commons';
import Table from '../../components/Table';
import GsfClient from '../../components/GsfClient';
import Page from '../../layout/Page';
import Modal from '../../components/Modal';

interface IState {
  data: IProjectStorage[];
  selectedRows: number[];
}

export default class ProjectList extends React.Component<RouteComponentProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      selectedRows: [],
    };

    this.deleteHandler = this.deleteHandler.bind(this);
  }

  async openConfigHashModal(project: IProjectStorage) {
    const config: IProjectConfigHash = await GsfClient.fetch<IProjectConfigHash>(HttpMethod.GET, `project/${project.id}/config`);

    const textarea = React.createRef<HTMLTextAreaElement>();

    Modal.instance.show(
      'Configuration Hash',
      [
        <textarea key="textarea" id="configHashArea" readOnly rows={4} style={{ width: '100%' }} value={config.hash} ref={textarea} />,
        <p key="help" style={{ marginBottom: 0 }}>Use this hash to copy project configuration.</p>,
      ],
      [
        {
          title: 'Copy to clipboard',
          value: 'copy',
          clickHandler: evt => {
            textarea.current.select();
            document.execCommand('copy');
          },
          close: false,
        },
        {
          title: 'Close',
          value: 'close',
        },
      ],
    );
  }

  async crawlProject(project: IProjectStorage) {
    try {
      await GsfClient.fetch(HttpMethod.GET, `project/${project.id}/crawl`);
    }
    catch (err) {
      Modal.instance.show('Scrape Project', <p id="error">{err}</p>);
    }
  }

  async deleteProject(project: IProjectStorage) {
    try {
      await GsfClient.fetch(HttpMethod.DELETE, 'projects', { ids: [ project.id ] });
    }
    catch (err) {
      Modal.instance.show('Delete Project', <p id="error">{err}</p>);
    }

    this.loadProjects();
  }

  viewResults(project: IProjectStorage) {
    this.props.history.push(`/project/${project.id}/results`);
  }

  componentDidMount() {
    this.loadProjects();
  }

  async loadProjects() {
    const data: IProjectStorage[] = await GsfClient.fetch<IProjectStorage[]>(HttpMethod.GET, 'projects');
    this.setState({ data });
  }

  async deleteHandler() {
    // no project(s) selected for deletion
    if (this.state.selectedRows.length === 0) return;

    // retrieve ids for the projects to be deleted
    const deleteIds = this.state.selectedRows.map(selectedRow => this.state.data[selectedRow].id);

    try {
      // remove projects
      await GsfClient.fetch(HttpMethod.DELETE, 'projects', { ids: deleteIds });

      // clear row selection
      this.setState({ selectedRows: [] });
    }
    catch (err) {
      Modal.instance.show('Delete Project', <p id="error">{err}</p>);
    }

    this.loadProjects();
  }

  render() {
    return (
      <Page
        title='Projects'
        actions={[
          <NavLink key='newproject' id='newproject' to='/project/' className='btn btn-secondary float-right'>New Project</NavLink>,
        ]}
      >
        <Table
          header={[
            {
              label: 'Name',
              render: (project: IProjectStorage) => (project.name),
            },
            {
              label: 'Description',
              render: (project: IProjectStorage) => (
                <span style={{ textOverflow: 'ellipsis' }}>
                  {project.description ? project.description.substr(0, 100) : ''}
                </span>
              ),
            },
            {
              label: 'Status',
              render: () => '-',
            },
            {
              label: 'Actions',
              renderLink: false,
              render: (project: IProjectStorage) => ([
                <input
                  key={`configHash-${project.id}`}
                  id={`configHash-${project.id}`}
                  type='button'
                  className='btn-secondary mr-2'
                  value='Config Hash'
                  onClick={() => this.openConfigHashModal(project)}
                />,
                <input
                  key={`crawl-${project.id}`}
                  id={`crawl-${project.id}`}
                  type='button'
                  className='btn-secondary mr-2'
                  value='Scrape'
                  onClick={() => this.crawlProject(project)}
                />,
                <input
                  key={`results-${project.id}`}
                  id={`results-${project.id}`}
                  type='button'
                  className='btn-secondary mr-2'
                  value='Results'
                  onClick={() => this.viewResults(project)}
                />,
                <input
                  key={`delete-${project.id}`}
                  id={`delete-${project.id}`}
                  type='button'
                  className='btn-secondary'
                  value='Delete'
                  onClick={() => this.deleteProject(project)}
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

  rowLink(row: IProjectStorage) {
    return `/project/${row.id}`;
  }
}
