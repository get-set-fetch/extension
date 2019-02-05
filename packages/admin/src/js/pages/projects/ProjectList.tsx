import * as React from 'react';
import Table, { IHeaderCol } from '../../components/Table';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import Project from './model/Project';
import Page from '../../layout/Page';
import { NavLink } from 'react-router-dom';

interface IState {
  header: IHeaderCol[];
  data: Project[];
  selectedRows: number[];
}

export default class ProjectList extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Name',
          render: (project:Project) => (project.name),
        },
        {
          label: 'Description',
          render: (project:Project) => (<span style={{ textOverflow: 'ellipsis' }}>{project.description ? project.description.substr(0, 100) : ""}</span>),
        },
      ],
      data: [],
      selectedRows: [],
    };

    this.deleteHandler = this.deleteHandler.bind(this);
  }

  componentDidMount() {
    this.loadProjects();
  }

  async loadProjects() {
    const data:Project[] = (await GsfClient.fetch(HttpMethod.GET, 'projects')) as Project[];
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
        title="Projects"
        actions={[
          <NavLink to="/project/" className="btn btn-secondary float-right">New Project</NavLink>
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

  rowLink(row:Project) {
    return `/project/${row.id}`;
  }
}
