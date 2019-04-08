import * as React from 'react';
import { setIn, getIn } from 'immutable';
import GsfClient from '../../components/GsfClient';
import { HttpMethod, IEnhancedJSONSchema, IScenario } from 'get-set-fetch-extension-commons';
import ScenarioHelper from '../scenarios/model/ScenarioHelper';
import { History } from 'history';
import { match } from 'react-router';
import Project from './model/Project';
import Form, { UiSchema } from 'react-jsonschema-form';
import BaseFormSchema from './schema/project-form-schema.json';
import BaseFormUiSchema from './schema/project-form-ui-schema.json';
import SchemaField from '../../components/react-jsonschema-form/SchemaField';
import BaseInput from '../../components/react-jsonschema-form/widgets/BaseInput';
import ScenarioDescription from '../../components/react-jsonschema-form/widgets/ScenarioDescription';
import ScenarioHomepage from '../../components/react-jsonschema-form/widgets/ScenarioHomepage';
import { NavLink } from 'react-router-dom';
import Page from '../../layout/Page';
import { IScenarioPackage } from 'get-set-fetch-extension-commons/lib/scenario';

interface IProps {
  history: History;
  match: match<{
    projectId: string;
  }>;
}

interface IState {
  scenarioPkgs: IScenarioPackage[];

  project: Project;
  scenario: IScenario;

  // schemas defining project props without plugable scenario props
  baseProjectSchema: IEnhancedJSONSchema;
  baseProjectUiSchema: UiSchema;

  // schemas defining project props combined with plugable scenario props
  mergedSchema: IEnhancedJSONSchema;
  mergedUiSchema: UiSchema;

  // reference to form element
  formRef: any;
}

export default class ProjectDetail extends React.Component<IProps, IState> {
  static defaultProps = {
    projectId: null
  };

  constructor(props) {
    super(props);

    this.state = {
      scenarioPkgs: [],

      project: null,
      scenario: null,

      baseProjectSchema: BaseFormSchema as IEnhancedJSONSchema,
      baseProjectUiSchema: BaseFormUiSchema,

      mergedSchema: BaseFormSchema as IEnhancedJSONSchema,
      mergedUiSchema: BaseFormUiSchema,

      formRef: null
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);
  }

  async componentDidMount() {
    // load project
    const { projectId } = this.props.match.params;
    const data: object = projectId ? await GsfClient.fetch(HttpMethod.GET, `project/${projectId}`) : {};
    const project: Project = new Project(data);

    // load available scenarios
    const scenarioPkgs: IScenarioPackage[] = (await GsfClient.fetch(HttpMethod.GET, 'scenarios')) as IScenarioPackage[];

    // compute new baseProjectSchema for scenario dropdown
    const scenarioIdProp = Object.assign({}, this.state.baseProjectSchema.properties.scenarioId);
    scenarioIdProp.enum = scenarioPkgs.map(pkg => pkg.id);
    scenarioIdProp.enumNames = scenarioPkgs.map(pkg => pkg.name);
    const baseProjectSchema = setIn(this.state.baseProjectSchema, ['properties', 'scenarioId'], scenarioIdProp);

    let scenario;
    let mergedSchema;
    let mergedUiSchema;

    // a scenario is already selected
    if (project.scenarioId) {
      // get scenario package and update corresponding project fields
      const scenarioPkg = scenarioPkgs.find(scenarioPkg => scenarioPkg.id === project.scenarioId);
      project.scenarioProps.description = scenarioPkg.package.description;
      project.scenarioProps.homepage = scenarioPkg.package.homepage;

      // instantiate scenario
      scenario = await ScenarioHelper.instantiate(project.scenarioId);

      // further update the merged schemas
      mergedSchema = this.getMergedSchema(scenario);
      mergedSchema = setIn(mergedSchema, ['properties', 'scenarioId'], scenarioIdProp);
      mergedUiSchema = this.getMergedUiSchema(scenario);
    }
    else {
      mergedSchema = setIn(baseProjectSchema, ['properties', 'scenarioId'], scenarioIdProp);
      mergedUiSchema = this.state.baseProjectUiSchema;
    }

    // update state
    this.setState({ scenarioPkgs, scenario, project, baseProjectSchema, mergedSchema, mergedUiSchema });
  }

  getMergedSchema(scenario: IScenario): IEnhancedJSONSchema {
    // start from the scenario schema
    let scenarioSchema = scenario.getConfigFormSchema();

    // add scenario description, homepage to it
    scenarioSchema = setIn(
      scenarioSchema,
      ['properties', 'homepage'],
      getIn(this.state.baseProjectSchema, ['properties', 'scenarioProps', 'properties', 'homepage'], {})
    );
    scenarioSchema = setIn(
      scenarioSchema,
      ['properties', 'description'],
      getIn(this.state.baseProjectSchema, ['properties', 'scenarioProps', 'properties', 'description'], {})
    );

    // scenarioProps subtitle should be empty
    scenarioSchema = setIn(scenarioSchema, ['title'], '');

    // merge scenario schema into the base one
    const mergedSchema = setIn(
      this.state.baseProjectSchema,
      ['properties', 'scenarioProps'],
      scenarioSchema
    );

    return mergedSchema;
  }

  getMergedUiSchema(scenario: IScenario): UiSchema {
    // start from the scenario schema
    let scenarioUiSchema = scenario.getConfigFormUISchema();

    // add scenario description, homepage to it
    scenarioUiSchema = setIn(
      scenarioUiSchema,
      ['homepage'],
      getIn(this.state.baseProjectUiSchema, ['scenarioProps', 'homepage'], {})
    );
    scenarioUiSchema = setIn(
      scenarioUiSchema,
      ['description'],
      getIn(this.state.baseProjectUiSchema, ['scenarioProps', 'description'], {})
    );

    // update scenario ui order to include the newly added fields
    const scenarioUiOrder = getIn(scenarioUiSchema, ['ui:order'], []);

    scenarioUiSchema = setIn(
      scenarioUiSchema,
      ['ui:order'],
      ['description', 'homepage'].concat(scenarioUiOrder)
    );

    // merge scenario schema into the base one
    const mergedUiSchema = setIn(
      this.state.baseProjectSchema,
      ['scenarioProps'],
      scenarioUiSchema
    );

    return mergedUiSchema;
  }

  async changeHandler({ formData }) {
    const newScenarioId = formData.scenarioId;
    const currentScenarioId = this.state.project.scenarioId;
    const scenarioChanged = newScenarioId !== currentScenarioId;

    // scenario option changed
    if (scenarioChanged) {
      // no scenario selected
      if (!newScenarioId) {
        this.setState({
          project: new Project(formData),
          scenario: null,
          mergedSchema: setIn(this.state.baseProjectSchema, ['properties', 'scenarioProps', 'properties'], {}),
          mergedUiSchema: setIn(this.state.baseProjectUiSchema, ['scenarioProps'], {})
        });
      }
       // new scenario selected
      else {
        const scenario: IScenario = await ScenarioHelper.instantiate(newScenarioId);
        const mergedSchema = this.getMergedSchema(scenario);
        const mergedUiSchema = this.getMergedUiSchema(scenario);

        // update form data with scenario info
        const scenarioPkg = this.state.scenarioPkgs.find(scenarioPkg => scenarioPkg.id === newScenarioId);
        let updatedFormData = setIn(formData, ['scenarioProps', 'description'], scenarioPkg.package.description);
        updatedFormData = setIn(updatedFormData, ['scenarioProps', 'homepage'], scenarioPkg.package.homepage);

        this.setState({
          project: new Project(updatedFormData),
          scenario,
          mergedSchema,
          mergedUiSchema
        });
      }
    }
    // base property other than scenarioId has changed
    else {
      this.setState({
        project: new Project(formData)
      });
    }
  }

  async submitHandler() {
    // validate form
    const { errors } = this.state.formRef.validate(this.state.formRef.state.formData);

    // only proceed to saving if no validation errors are present
    if (errors.length !== 0) return;

    // add plugable pluginDefinitions to current project
    const pluginDefinitions = this.state.scenario.getPluginDefinitions(this.state.project.scenarioProps);

    const finalProject = setIn(this.state.project, ['pluginDefinitions'], pluginDefinitions);

    try {
      if (this.state.project.id) {
        await GsfClient.fetch(HttpMethod.PUT, 'project', finalProject);
      }
      else {
        await GsfClient.fetch(HttpMethod.POST, 'project', finalProject);
      }
      this.props.history.push('/projects');
    }
    catch (err) {
      console.log('error saving project');
    }
  }

  validate(formData, errors) {
    // errors.fieldA.addError('fieldA invalid');
    return errors;
  }

  render() {
    if (!this.state.project) return null;

    return (
      <Page
        title={this.state.project.name ? this.state.project.name : 'New Project'}
      >
        <Form
          className='form-main'
          ref={(form) => {
            if (!this.state.formRef) {
              this.setState({ formRef: form });
            }
          }}
          fields={{ SchemaField }}
          widgets={{ BaseInput, ScenarioDescription, ScenarioHomepage }}

          schema={this.state.mergedSchema}
          uiSchema={this.state.mergedUiSchema}

          liveValidate={true}
          validate={this.validate}
          showErrorList={false}

          formData={this.state.project.toJS()}
          onChange={this.changeHandler}
        >
          <div className='form-group row'>
            <div className='col-sm-2'/>
            <div className='col-sm-5'>
              <a id='save' className='btn btn-secondary' href='#' role='button' onClick={this.submitHandler}>Save</a>
              <NavLink id='cancel' to='/projects' className='btn btn-light ml-4'>Cancel</NavLink>
            </div>
          </div>
        </Form>
      </Page>
    );
  }
}
