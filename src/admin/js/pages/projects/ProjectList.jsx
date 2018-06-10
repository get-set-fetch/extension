import React from 'react';
import { NavLink } from 'react-router-dom';
import Table from '../../components/Table';
import GsfClient from '../../components/GsfClient';

export default class ProjectList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'name',
          prop: 'name',
          render: site => (<td><NavLink to={`/site/${site.id}`} className="nav-link">{site.name}</NavLink></td>),
        },
        { label: 'url', prop: 'url' },
      ],
      data: [],
      currentSite: {},
    };
  }

  async componentDidMount() {
    const data = await GsfClient.fetch('GET', 'site');
    this.setState({ data });
    console.log(data);
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return [
      <p>Project List</p>,
      <Table header={this.state.header} data={this.state.data} />,
    ];
  }
}
