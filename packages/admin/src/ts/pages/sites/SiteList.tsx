import * as React from 'react';
import { NavLink } from 'react-router-dom';
import Table, { IHeaderCol } from '../../components/Table';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
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
  static async crawlSite(site:Site) {
    try {
      await GsfClient.fetch(HttpMethod.GET, `site/${site.id}/crawl`);
    }
    catch (err) {
      console.log('error crawling site');
    }
  }

  async deleteSite(site:Site) {
    try {
      // remove sites
      await GsfClient.fetch(HttpMethod.DELETE, 'sites', { ids: [site.id] });
    }
    catch (err) {
      console.log('error deleting site');
    }

    this.loadSites();
  }

  static async exportCSV(site, evt) {
    // store dom target for this synthetic event
    const { target } = evt;

    // download href has just been set don't recreate it again, allow the browser to naturally follow the download link
    if (target.hasAttribute('downloadready')) {
      target.removeAttribute('downloadready');
      return;
    }

    // download href is obsolete or missing, prevent browser from downloading the content
    evt.preventDefault();

    // load just the crawled resources for the current site
    let crawledResources:Resource[] = [];
    try {
      crawledResources = (await GsfClient.fetch(HttpMethod.GET, `resources/${site.id}/crawled`)) as Resource[];
    }
    catch (err) {
      console.log(err);
      console.log('error exporting site resources as csv');
    }

    // some of the crawled resources may not contain the info obj depending on the plugin used, filter those out
    const contentResources = crawledResources.filter(resource => (
      typeof resource.info === 'object' && Object.keys(resource.info).length > 0
    ));

    // no crawled resources with valid info content found
    if (contentResources.length === 0) {
      alert('Nothing to export. No resources crawled or with valid content');
      return;
    }

    // transform resources into csv
    const info = crawledResources.map(resource => resource.info || {});
    const csv = ExportHelper.csv(info);

    // (re)create blob and anchor href for download
    DownloadHelper.revokeObjectUrl(target.href);
    DownloadHelper.createBlobURL(target, csv, 'text/plain');
    target.setAttribute('downloadready', true);
    target.click();
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
                onClick={() => SiteList.crawlSite(site)}
              />,
              <a
                id={`csv-${site.id}`}
                className="mr-2"
                href="#"
                target="_blank"
                download={site.name}
                onClick={evt => SiteList.exportCSV(site, evt)}
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
  }

  componentDidMount() {
    this.loadSites();
  }

  async loadSites() {
    const data:Site[] = (await GsfClient.fetch(HttpMethod.GET, 'sites')) as Site[];
    this.setState({ data });
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
