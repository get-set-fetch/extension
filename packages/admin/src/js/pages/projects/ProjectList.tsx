import * as React from 'react';
import { NavLink } from 'react-router-dom';
import Table from '../../components/Table';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import Project from './model/Project';

interface IState {
  header: any[];
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
          render: (project:Project) => (<td><NavLink to={`/project/${project.id}`} className="nav-link">{project.name}</NavLink></td>),
        },
        {
          label: 'Description',
          render: (project:Project) => (<td><span style={{ textOverflow: 'ellipsis' }}>{project.description.substr(0, 100)}</span></td>),
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
    this.loadProjects();
  }

  async loadProjects() {
    const data:Project[] = (await GsfClient.fetch(HttpMethod.GET, 'project')) as Project[];
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
      <NavLink id="newproject" key="newproject" to="/project/" className="nav-link">Create new crawl project</NavLink>,
      <p key="title">Project List</p>,
      <input key="del" id="delete" type="button" value="Delete" onClick={this.deleteHandler}/>,
      <Table key="listTable"
        header={this.state.header} data={this.state.data}
        onRowSelectionChange={this.onRowSelectionChange} onHeaderSelectionChange={this.onHeaderSelectionChange}
        selectedRows={this.state.selectedRows} />,
    ];
  }
}
