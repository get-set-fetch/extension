import * as React from 'react';
import { match } from 'react-router';
import { IScenario, HttpMethod, IExportOpt, IExportResult, ExportType, IScenarioDefinition } from 'get-set-fetch-extension-commons';
import GsfClient from '../../components/GsfClient';
import Page from '../../layout/Page';
import Table from '../../components/Table';
import Project from './model/Project';
import Resource from '../sites/model/Resource';
import ScenarioHelper from '../scenarios/model/ScenarioHelper';

interface IProps {
  match: match<{
    projectId: string;
  }>;
}

interface IState {
  project: Project;
  scenario: IScenario;
  results: object[];
}

export default class ProjectResults extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      project: null,
      scenario: null,
      results: null
    };

    this.export = this.export.bind(this);
  }

  async componentDidMount() {
      const { projectId } = this.props.match.params;

      // load project
      const projectData = projectId ? await GsfClient.fetch(HttpMethod.GET, `project/${projectId}`) : {};
      const project: Project = new Project(projectData);

      // project not found, nothing more to do
      if (!project.id) return;

      // instantiate scenario
      const scenario = await ScenarioHelper.instantiate(project.scenarioId);

      // load results
      const results = await this.loadResourcesInfo(project);

      this.setState({ project, scenario, results });
  }

  async loadResourcesInfo(project: Project): Promise<object[]> {
    let resources = [];

    try {
      resources = (await GsfClient.fetch(HttpMethod.GET, `project/${project.id}/resources`)) as Resource[];
    }
    catch (err) {
      console.log(err);
      console.log('error loading project resources');
    }

    /*
    // some of the crawled resources may not contain the info obj depending on the plugin used, filter those out
    crawledResources = crawledResources.filter(resource => (
      typeof resource.info === 'object' && Object.keys(resource.info).length > 0
    ));
    return crawledResources.map(resource => resource.info || {});
    */

    return resources;
 }

  async export(evt: React.MouseEvent<HTMLAnchorElement>, exportType: ExportType) {
    const { currentTarget } = evt;

    // download href has just been set don't recreate it again, allow the browser to naturally follow the download link
    if (currentTarget.hasAttribute('downloadready')) {
      currentTarget.removeAttribute('downloadready');
      return;
    }
    evt.preventDefault();

    const exportOpt: IExportOpt = this.state.scenario.getResultExportOpts().find(exportOpt => exportOpt.type === exportType);
    const exportInfo: IExportResult = await GsfClient.fetch(HttpMethod.GET, `project/export/${this.state.project.id}`, exportOpt);

    currentTarget.href = exportInfo.url;
    currentTarget.setAttribute('downloadready', 'true');
    currentTarget.click();
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
          // project found, render results
          this.state.project.id &&
            <Table
            header={this.state.scenario.getResultTableHeaders()}
            data={this.state.results}
          />
        }
      </Page>
    );
  }

  renderExportButton() {
    return ([
      <div className='dropdown btn btn-secondary mr-2 float-right'>
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
              id={`${exportOpt.type}-${this.state.project.id}`}
              className='dropdown-item'
              href='#'
              target='_blank'
              download={`${this.state.project.name}.${exportOpt.type}`}
              onClick={(evt)=> this.export(evt, exportOpt.type)}
            >
              {exportOpt.type.toLocaleUpperCase()}
            </a>
          ))
        }
        </div>
      </div>
    ]);
  }
}