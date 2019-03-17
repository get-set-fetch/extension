import * as React from 'react';
import { History } from 'history';
import { NavLink } from 'react-router-dom';
import { HttpMethod } from 'get-set-fetch-extension-commons';
import Table, { IHeaderCol } from '../../components/Table';
import GsfClient from '../../components/GsfClient';
import Project from './model/Project';
import Page from '../../layout/Page';

interface IProps {
  history: History;
}

interface IState {
  header: IHeaderCol[];
  data: Project[];
  selectedRows: number[];
}

export default class ProjectList extends React.Component<IProps, IState> {

  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Name',
          render: (project: Project) => (project.name)
        },
        {
          label: 'Description',
          render: (project: Project) => (<span style={{ textOverflow: 'ellipsis' }}>{project.description ? project.description.substr(0, 100) : ''}</span>)
        },
        {
          label: 'Status',
          render: (project: Project) => '-'
        },
        {
          label: 'Actions',
          renderLink: false,
          render: (project: Project) => ([
              <input
                id={`crawl-${project.id}`}
                type='button'
                className='btn-secondary mr-2'
                value='Crawl'
                onClick={() => this.crawlProject(project)}
              />,
              <input
                id={`results-${project.id}`}
                type='button'
                className='btn-secondary mr-2'
                value='Results'
                onClick={() => this.viewResults(project)}
              />,
              <input
                id={`delete-${project.id}`}
                type='button'
                className='btn-secondary'
                value='Delete'
                onClick={evt => this.deleteProject(project)}
              />
          ])
        }
      ],
      data: [],
      selectedRows: []
    };

    this.deleteHandler = this.deleteHandler.bind(this);
  }
  async crawlProject(project: Project) {
    try {
      await GsfClient.fetch(HttpMethod.GET, `project/${project.id}/crawl`);
    }
    catch (err) {
      console.log('error crawling project');
    }
  }

  async deleteProject(project: Project) {
    try {
      await GsfClient.fetch(HttpMethod.DELETE, 'projects', { ids: [project.id] });
    }
    catch (err) {
      console.log('error deleting site');
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
      console.log('error deleting projects');
    }

    this.loadProjects();
  }

  render() {
    return (
      <Page
        title='Projects'
        actions={[
          <NavLink id='newproject' to='/project/' className='btn btn-secondary float-right'>New Project</NavLink>
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
