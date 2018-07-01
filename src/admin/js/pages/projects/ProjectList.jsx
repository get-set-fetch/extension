import React from 'react';
import { NavLink } from 'react-router-dom';
import Table from '../../components/Table';
import GsfClient from '../../components/GsfClient';

export default class ProjectList extends React.Component {
  static async crawlSite(site) {
    try {
      await GsfClient.fetch('GET', `site/${site.id}/crawl`, { site, crawl: true });
    }
    catch (err) {
      console.log('error crawling site');
    }
  }

  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Name',
          prop: 'name',
          render: site => (<td><NavLink to={`/site/${site.id}`} className="nav-link">{site.name}</NavLink></td>),
        },
        { label: 'URL', prop: 'url' },
        { label: 'Status', prop: 'status' },
        {
          label: 'Actions',
          render: site => (
            <td>
              <input type="button" className="btn-secondary" value="Crawl" onClick={ProjectList.crawlSite.bind(this, site)}/>
            </td>
          ),
        },
      ],
      data: [],
      currentSite: {},
    };
  }

  async componentDidMount() {
    const data = await GsfClient.fetch('GET', 'sites');
    this.setState({ data });
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return [
      <p key="listHeader">Project List</p>,
      <Table key="listTable" header={this.state.header} data={this.state.data} />,
    ];
  }
}
