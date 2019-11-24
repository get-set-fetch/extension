import * as React from 'react';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import { HttpMethod, IHeaderCol } from 'get-set-fetch-extension-commons';
import { IProjectConfigHash } from 'get-set-fetch-extension-commons/lib/project';
import Table from '../../components/Table';
import GsfClient from '../../components/GsfClient';
import Project from './model/Project';
import Page from '../../layout/Page';
import Modal from '../../components/Modal';

interface IState {
  header: IHeaderCol[];
  data: Project[];
  selectedRows: number[];
}

export default class ProjectList extends React.Component<RouteComponentProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Name',
          render: (project: Project) => (project.name),
        },
        {
          label: 'Description',
          render: (project: Project) => (
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
          render: (project: Project) => ([
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
      ],
      data: [],
      selectedRows: [],
    };

    this.deleteHandler = this.deleteHandler.bind(this);
  }

  async openConfigHashModal(project: Project) {
    const config: IProjectConfigHash = await GsfClient.fetch(HttpMethod.GET, `project/${project.id}/config`) as IProjectConfigHash;

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

  async crawlProject(project: Project) {
    try {
      await GsfClient.fetch(HttpMethod.GET, `project/${project.id}/crawl`);
    }
    catch (err) {
      console.error('error crawling project');
    }
  }

  async deleteProject(project: Project) {
    try {
      await GsfClient.fetch(HttpMethod.DELETE, 'projects', { ids: [ project.id ] });
    }
    catch (err) {
      console.error('error deleting site');
    }

    this.loadProjects();
  }

  viewResults(project: Project) {
    this.props.history.push(`/project/${project.id}/results`);
  }

  componentDidMount() {
    this.loadProjects();
  }

  async loadProjects() {
    const data: Project[] = (await GsfClient.fetch(HttpMethod.GET, 'projects')) as Project[];
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
      console.error('error deleting projects');
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
          header={this.state.header}
          rowLink={this.rowLink}
          data={this.state.data}
        />
      </Page>
    );
  }

  rowLink(row: Project) {
    return `/project/${row.id}`;
  }
}
