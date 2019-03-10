import * as React from 'react';
import { match } from 'react-router';
import { IScenarioInstance, HttpMethod, IExportOpt, IExportResult, ExportType } from 'get-set-fetch-extension-commons';
import GsfClient from '../../components/GsfClient';
import Page from '../../layout/Page';
import Table from '../../components/Table';
import Project from './model/Project';
import IScenario from '../scenarios/model/Scenario';
import Resource from '../sites/model/Resource';

interface IProps {
  match: match<{
    projectId: string;
  }>;
}

interface IState {
  project: Project;
  scenario: IScenario;
  scenarioInstance: IScenarioInstance;
  results: object[];
}

export default class ProjectResults extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      project: null,
      scenario: null,
      scenarioInstance: null,
      results: null
    }

    this.exportCsv = this.exportCsv.bind(this);
    this.exportZip = this.exportZip.bind(this);

    // using SystemJS, fetch scenario from IndexedDB, only one scenario linked to project, no parametrization
    System.constructor.prototype.fetch = () => {
      return new Promise(resolve => {
        resolve(this.state.scenario.code);
      })
    }
  }

  async componentDidMount() {
      const { projectId } = this.props.match.params;

      // load project
      const projectData = projectId ? await GsfClient.fetch(HttpMethod.GET, `project/${projectId}`) : {};
      const project:Project = new Project(projectData);

      // project not found, nothing more to do
      if (!project.id) return;

      // load scenario, wait for state to be updated as systemjs import is based on it
      const scenario:IScenario = (await GsfClient.fetch(HttpMethod.GET, `scenario/${project.scenarioId}`)) as IScenario;
      await new Promise(resolve => {
        this.setState({scenario}, () => resolve())
      })

      // instantiate scenario
      const scenarioInstance = await this.loadScenario(project.scenarioId);

      // load results
      const results = await this.loadResourcesInfo(project);

      this.setState({project, scenarioInstance, results});
  }

  async loadScenario(scenarioId: string) {
    const ScenarioModule  = await System.import(`./${scenarioId}`);
    const ScenarioCls = ScenarioModule.default;
    const scenarioInstance:ScenarioInstance = new ScenarioCls();
    scenarioInstance.id = scenarioId;
    return scenarioInstance;
  }

  async loadResourcesInfo(project:Project):Promise<object[]> {
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

  async exportCsv(evt:React.MouseEvent<HTMLAnchorElement>) {
    const {currentTarget} = evt;
    
    // download href has just been set don't recreate it again, allow the browser to naturally follow the download link
    if (currentTarget.hasAttribute('downloadready')) {
      currentTarget.removeAttribute('downloadready');
      return;
    }
    evt.preventDefault();

    const exportOpt = this.state.scenarioInstance.getResultExportOpts().find(exportOpt => exportOpt.type === 'csv');
    const exportInfo:IExportInfo = await GsfClient.fetch(HttpMethod.GET, `project/export/${this.state.project.id}`, exportOpt);

    currentTarget.href = exportInfo.url;
    currentTarget.setAttribute('downloadready', "true");
    currentTarget.click();
  }

  async exportZip(evt:React.MouseEvent<HTMLAnchorElement>) {
    const {currentTarget} = evt;

    // download href has just been set don't recreate it again, allow the browser to naturally follow the download link
    if (currentTarget.hasAttribute('downloadready')) {
      currentTarget.removeAttribute('downloadready');
      return;
    }

    evt.preventDefault();

    const exportInfo:IExportInfo = await GsfClient.fetch(HttpMethod.GET, `project/export/${this.state.project.id}`);
    currentTarget.href = exportInfo.url;
    currentTarget.setAttribute('downloadready', "true");
    currentTarget.click();
  }

  render() {
    // don't render till project is loaded
    if (!this.state.project) return null;

    return (
      <Page
        title={this.state.project.id ? `${this.state.project.name} results` : "Project not found"}
        actions={ this.state.project.id ? this.renderExportButton() : [] }
        >
        {
          // project not found
          !this.state.project.id && (
            <div className="alert alert-danger" role="alert">
               <p>Project not found</p>
            </div>
          )
        }
        {
          // project found, render results
          this.state.project.id &&
            <Table
            header={this.state.scenarioInstance.getResultTableHeaders()}
            data={this.state.results}
          />
        }
      </Page>
    );
  }

  renderExportButton() {
    return ([
      <div className="dropdown btn btn-secondary mr-2 float-right">
        <button
          className="btn btn-secondary dropdown-toggle"
          type="button"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false">
          Export
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
        {
          this.state.scenarioInstance.getResultExportOpts().map(exportOpt => (
            <a
              id={`${exportOpt.type}-${this.state.project.id}`}
              className="dropdown-item"
              href="#"
              target="_blank"
              download={this.state.project.name}
              onClick={exportOpt.type === 'csv' ? this.exportCsv : this.exportZip}
            >
              {exportOpt.type === 'csv' ? 'CSV' : 'ZIP'}
            </a>
          ))
        }
        </div>
      </div>
    ])
  }
}