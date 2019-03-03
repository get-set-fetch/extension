import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {HttpMethod} from 'get-set-fetch-extension-commons';
import Table, { IHeaderCol } from '../../components/Table';
import GsfClient from '../../components/GsfClient';
import ExportHelper from '../../utils/ExportHelper';
import DownloadHelper from '../../utils/DownloadHelper';
import Site from './model/Site';
import Resource from './model/Resource';
import Page from '../../layout/Page';

interface IState {
  header: IHeaderCol[];
  data: Site[];
}

export default class SiteList extends React.Component<{}, IState> {
  async crawlSite(site:Site) {
    try {
      await GsfClient.fetch(HttpMethod.GET, `site/${site.id}/crawl`);
    }
    catch (err) {
      console.log('error crawling site');
    }
  }

  async deleteSite(site:Site) {
    try {
      await GsfClient.fetch(HttpMethod.DELETE, 'sites', { ids: [site.id] });
    }
    catch (err) {
      console.log('error deleting site');
    }

    this.loadSites();
  }

  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Name',
          render: (site:Site) => site.name,
        },
        {
          label: 'URL',
          render: (site:Site) => site.url,
        },
        {
          label: 'Status',
          render: (site:Site) => "-",
        },
        {
          label: 'Actions',
          renderLink: false,
          render: (site:Site) => ([
              <input
                id={`crawl-${site.id}`}
                type="button"
                className="btn-secondary mr-2"
                value="Crawl"
                onClick={() => this.crawlSite(site)}
              />,
              <a
                id={`csv-${site.id}`}
                data-id={site.id}
                className="mr-2"
                href="#"
                target="_blank"
                download={site.name}
                onClick={this.exportCSV}
              >
                CSV
              </a>,
              <input
                id={`delete-${site.id}`}
                type="button"
                className="btn-secondary"
                value="Delete"
                onClick={evt => this.deleteSite(site)}
              />,
          ]),
        },
      ],
      data: [],
    };

    this.deleteSite = this.deleteSite.bind(this);
    this.exportCSV = this.exportCSV.bind(this);
  }

  componentDidMount() {
    this.loadSites();
  }

  async loadSites() {
    const data:Site[] = (await GsfClient.fetch(HttpMethod.GET, 'sites')) as Site[];
    this.setState({ data });
  }

  async loadResourcesInfo(siteId:string):Promise<object[]> {
     // load just the crawled resources for the current site
     let crawledResources:Resource[] = [];
     try {
       crawledResources = (await GsfClient.fetch(HttpMethod.GET, `resources/${siteId}/crawled`)) as Resource[];
     }
     catch (err) {
       console.log(err);
       console.log('error loading site resources');
     }
     // some of the crawled resources may not contain the info obj depending on the plugin used, filter those out
     crawledResources = crawledResources.filter(resource => (
       typeof resource.info === 'object' && Object.keys(resource.info).length > 0
     ));
     return crawledResources.map(resource => resource.info || {});
  }

  exportCSV(evt:React.MouseEvent<HTMLAnchorElement>) {
    const siteId = evt.currentTarget.dataset.id;
    DownloadHelper.exportCSV(this.loadResourcesInfo(siteId), evt);
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <Page
        title="Sites"
        actions={[
          <NavLink id="newsite" to="/site/" className="btn btn-secondary float-right">Add New Site</NavLink>
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

  // eslint-disable-next-line class-methods-use-this
  componentWillUnmount() {
    DownloadHelper.revokeAllObjectUrls();
  }

  rowLink(row:Site) {
    return `/site/${row.id}`;
  }
}
