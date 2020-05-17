import * as React from 'react';
import { IScenario, HttpMethod, IExportOpt, IExportResult, ExportType, IProjectStorage } from 'get-set-fetch-extension-commons';
import { RouteComponentProps } from 'react-router-dom';
import GsfClient from '../../components/GsfClient';
import Page from '../../layout/Page';
import Modal from '../../components/Modal';
import ScenarioHelper from '../scenarios/model/ScenarioHelper';

interface IState {
  project: IProjectStorage;
  scenario: IScenario;
  csvResult: {
    header: string[];
    body: string[][];
  };
}

export default class ProjectResults extends React.Component<RouteComponentProps<{projectId: string}>, IState> {
  constructor(props) {
    super(props);

    this.state = {
      project: null,
      scenario: null,
      csvResult: null,
    };

    this.export = this.export.bind(this);
  }

  async componentDidMount() {
    const { projectId } = this.props.match.params;

    // load project
    const project: Partial<IProjectStorage> = projectId ? await GsfClient.fetch<IProjectStorage>(HttpMethod.GET, `project/${projectId}`) : {};

    // project not found, nothing more to do
    if (!project.id) return;

    // instantiate scenario
    const scenario = await ScenarioHelper.instantiate(project.scenario);

    // load results as csv
    const csvResult = await this.loadCsvResult(project as IProjectStorage, scenario);

    this.setState({ project: project as IProjectStorage, scenario, csvResult });
  }

  async loadCsvResult(project: IProjectStorage, scenario: IScenario) {
    let csv = null;

    try {
      csv = await GsfClient.fetch<{header: string[]; body: string[]}>(
        HttpMethod.GET,
        `project/${project.id}/csv`,
        scenario.getResultExportOpts().find(resultExportOpt => resultExportOpt.type === ExportType.CSV),
      );
    }
    catch (err) {
      console.error(err);
    }


    return csv;
  }

  async export(evt: React.MouseEvent<HTMLAnchorElement>, exportType: ExportType) {
    const { currentTarget } = evt;

    // download href has just been set don't recreate it again, allow the browser to naturally follow the download link
    if (currentTarget.hasAttribute('downloadready')) {
      currentTarget.removeAttribute('downloadready');
      return;
    }
    evt.preventDefault();

    try {
      const exportOpt: IExportOpt = this.state.scenario.getResultExportOpts().find(resultExportOpt => resultExportOpt.type === exportType);
      const exportInfo: IExportResult = await GsfClient.fetch(HttpMethod.GET, `project/export/${this.state.project.id}`, exportOpt);

      currentTarget.href = exportInfo.url;
      currentTarget.setAttribute('downloadready', 'true');
      currentTarget.click();
    }
    catch (error) {
      Modal.instance.show(
        'Export Project',
        [
          <p key="info">{error}</p>,
        ],
        [
          {
            title: 'Close',
            value: 'close',
          },
        ],
      );
      console.error(error);
    }
  }

  render() {
    // don't render till project is loaded
    if (!this.state.project) return null;

    return (
      <Page
        title={this.state.project.id ? `${this.state.project.name} results` : 'Project not found'}
        actions={ this.state.project.id ? this.renderExportButton() : [] }
      >
        {
          // project not found
          !this.state.project.id && (
            <div className='alert alert-danger' role='alert'>
              <p>Project not found</p>
            </div>
          )
        }
        {
          this.renderResults()
        }
      </Page>
    );
  }

  renderResults() {
    if (!this.state.project.id || !this.state.csvResult) return null;

    // project found, render results
    // we get away using idx as a react key because data is readonly, will not be modified
    return (
      <table className="table table-hover table-main">
        <tr>
          {
            this.state.csvResult.header.map((col, colIdx) => (<th key={colIdx}>{col}</th>))
          }
        </tr>
        <tbody>
          {
            this.state.csvResult.body.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {
                  row.map((colVal, colIdx) => (<td key={colIdx}>
                    {
                      colIdx === 0
                        ? this.renderResultLink(colVal.replace(/"/g, ''))
                        : colVal.replace(/"/g, '')
                    }
                  </td>))
                }
              </tr>
            ))
          }
        </tbody>
      </table>
    );
  }

  renderExportButton() {
    return ([
      <div key='export' className='dropdown btn btn-secondary mr-2 float-right'>
        <button
          id='export'
          className='btn btn-secondary dropdown-toggle'
          type='button'
          data-toggle='dropdown'
          aria-haspopup='true'
          aria-expanded='false'>
          Export
        </button>
        <div className='dropdown-menu' aria-labelledby='dropdownMenuButton'>
          {
            this.state.scenario.getResultExportOpts().map(exportOpt => (
              <a
                key={`${exportOpt.type}-${this.state.project.id}`}
                id={`${exportOpt.type}-${this.state.project.id}`}
                className='dropdown-item'
                href='#'
                target='_blank'
                download={`${this.state.project.name}.${exportOpt.type}`}
                onClick={evt => this.export(evt, exportOpt.type)}
              >
                {exportOpt.type.toLocaleUpperCase()}
              </a>
            ))
          }
        </div>
      </div>,
    ]);
  }

  renderResultLink(url: string) {
    const maxLen = 30;

    const shortenUrl = url.length < maxLen ? url : `...${url.substr(-maxLen)}`;
    return <a href={url} className="result-link" target='_blank' rel="noopener noreferrer">{shortenUrl}</a>;
  }
}
