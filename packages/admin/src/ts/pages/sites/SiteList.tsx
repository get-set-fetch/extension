import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { HttpMethod, IHeaderCol } from 'get-set-fetch-extension-commons';
import Table from '../../components/Table';
import GsfClient from '../../components/GsfClient';
import Site from './model/Site';
import Resource from './model/Resource';
import Page from '../../layout/Page';

interface IState {
  header: IHeaderCol[];
  data: Site[];
}

export default class SiteList extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Name',
          render: (site: Site) => site.name,
        },
        {
          label: 'URL',
          render: (site: Site) => site.url,
        },
        {
          label: 'Status',
          render: () => '-',
        },
        {
          label: 'Actions',
          renderLink: false,
          render: (site: Site) => ([
            <input
              key={`crawl-${site.id}`}
              id={`crawl-${site.id}`}
              type='button'
              className='btn-secondary mr-2'
              value='Crawl'
              onClick={() => this.crawlSite(site)}
            />,
            <input
              key={`delete-${site.id}`}
              id={`delete-${site.id}`}
              type='button'
              className='btn-secondary'
              value='Delete'
              onClick={() => this.deleteSite(site)}
            />,
          ]),
        },
      ],
      data: [],
    };

    this.deleteSite = this.deleteSite.bind(this);
  }

  async crawlSite(site: Site) {
    try {
      await GsfClient.fetch(HttpMethod.GET, `site/${site.id}/crawl`);
    }
    catch (err) {
      console.error('error crawling site');
    }
  }

  async deleteSite(site: Site) {
    try {
      await GsfClient.fetch(HttpMethod.DELETE, 'sites', { ids: [ site.id ] });
    }
    catch (err) {
      console.error('error deleting site');
    }

    this.loadSites();
  }

  componentDidMount() {
    this.loadSites();
  }

  async loadSites() {
    const data: Site[] = (await GsfClient.fetch(HttpMethod.GET, 'sites')) as Site[];
    this.setState({ data });
  }

  async loadResourcesInfo(siteId: string): Promise<object[]> {
    // load just the crawled resources for the current site
    let crawledResources: Resource[] = [];
    try {
      crawledResources = (await GsfClient.fetch(HttpMethod.GET, `resources/${siteId}/crawled`)) as Resource[];
    }
    catch (err) {
      console.error(err);
      console.error('error loading site resources');
    }
    // some of the crawled resources may not contain the info obj depending on the plugin used, filter those out
    crawledResources = crawledResources.filter(resource => (
      typeof resource.info === 'object' && Object.keys(resource.info).length > 0
    ));
    return crawledResources.map(resource => resource.info || {});
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <Page
        title='Sites'
      >
        <Table
          header={this.state.header}
          data={this.state.data}
        />
      </Page>
    );
  }

  rowLink(row: Site) {
    return `/site/${row.id}`;
  }
}
