import * as React from 'react';
import { NavLink } from 'react-router-dom';
import Table from '../../components/Table';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import ExportHelper from '../../utils/ExportHelper';
import DownloadHelper from '../../utils/DownloadHelper';
import Site from './model/Site';
import Resource from './model/Resource';

interface IState {
  header: any[];
  data: Site[];
  selectedRows: number[];
}

export default class SiteList extends React.Component<{}, IState> {
  static async crawlSite(site) {
    try {
      await GsfClient.fetch(HttpMethod.GET, `site/${site.id}/crawl`);
    }
    catch (err) {
      console.log('error crawling site');
    }
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
          prop: 'name',
          render: (site:Site) => (<td><NavLink to={`/site/${site.id}`} className="nav-link">{site.name}</NavLink></td>),
        },
        { label: 'URL', prop: 'url' },
        { label: 'Status', prop: 'status' },
        {
          label: 'Actions',
          render: (site:Site) => (
            <td>
              <input
                id={`crawl-${site.id}`}
                type="button"
                className="btn-secondary"
                value="Crawl"
                onClick={() => SiteList.crawlSite(site)}
              />
              <a
                id={`csv-${site.id}`}
                href="#"
                target="_blank"
                download={site.name}
                onClick={evt => SiteList.exportCSV(site, evt)}
              >CSV</a>
            </td>
          ),
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
    this.loadSites();
  }

  async loadSites() {
    const data:Site[] = (await GsfClient.fetch(HttpMethod.GET, 'sites')) as Site[];
    this.setState({ data });
  }

  async deleteHandler() {
    // no site(s) selected for deletion
    if (this.state.selectedRows.length === 0) return;

    // retrieve ids for the sites to be deleted
    const deleteIds = this.state.selectedRows.map(selectedRow => this.state.data[selectedRow].id);

    try {
      // remove sites
      await GsfClient.fetch(HttpMethod.DELETE, 'sites', { ids: deleteIds });

      // clear row selection
      this.setState({ selectedRows: [] });
    }
    catch (err) {
      console.log('error deleting sites');
    }

    this.loadSites();
  }

  onRowSelectionChange(toggleRow) {
    const newSelectedRows = Table.toggleSelection(this.state.selectedRows, toggleRow);
    this.setState({ selectedRows: newSelectedRows });
  }

  onHeaderSelectionChange(evt) {
    if (evt.target.checked) {
      this.setState({ selectedRows: Array(this.state.data.length).fill(1).map((elm, idx) => idx) });
    }
    else {
      this.setState({ selectedRows: [] });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return [
      <NavLink id="newsite" key="new" to="/site/" className="nav-link">Create new site</NavLink>,
      <p key="listHeader">Site List a22</p>,
      <input key="del" id="delete" type="button" value="Delete" onClick={this.deleteHandler}/>,
      <Table key="listTable"
        header={this.state.header} data={this.state.data}
        onRowSelectionChange={this.onRowSelectionChange} onHeaderSelectionChange={this.onHeaderSelectionChange}
        selectedRows={this.state.selectedRows} />,
    ];
  }

  // eslint-disable-next-line class-methods-use-this
  componentWillUnmount() {
    DownloadHelper.revokeAllObjectUrls();
  }
}
