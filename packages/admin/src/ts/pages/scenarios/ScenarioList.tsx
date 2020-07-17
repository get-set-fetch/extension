import * as React from 'react';
import { HttpMethod, IHeaderCol, IScenarioStorage } from 'get-set-fetch-extension-commons';
import GsfClient from '../../components/GsfClient';
import Page from '../../layout/Page';
import Table from '../../components/Table';
import Modal from '../../components/Modal';

enum ScenarioStatus {
  INSTALLED = 'Installed',
  AVAILABLE = 'Available',
  BUILTIN = 'Built-in'
}

interface IAdvancedScenarioPackage extends IScenarioStorage {
  status: ScenarioStatus;
}

interface IState {
  scenarioPkgs: IScenarioStorage[];
}

export default class ScenarioList extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      scenarioPkgs: null,
    };

    this.installScenarioPkg = this.installScenarioPkg.bind(this);
    this.uninstallScenarioPkg = this.uninstallScenarioPkg.bind(this);
  }

  componentDidMount() {
    this.loadScenarios();
  }

  async loadScenarios() {
    // get installed scenario packages
    const installedPkgs: IAdvancedScenarioPackage[] = (await GsfClient.fetch<IScenarioStorage[]>(HttpMethod.GET, 'scenarios'))
      .map(
        installedPkg => Object.assign(
          installedPkg,
          {
            status: installedPkg.builtin ? ScenarioStatus.BUILTIN : ScenarioStatus.INSTALLED,
          },
        ),
      );

    // get available scenario packages, only show the not already installed ones
    const installedPkgNames = installedPkgs.map(pkg => pkg.name);
    const availablePkgs: IAdvancedScenarioPackage[] = (await GsfClient.fetch<IScenarioStorage[]>(HttpMethod.GET, 'scenarios/available'))
      .filter(availablePkg => installedPkgNames.indexOf(availablePkg.name) === -1)
      .map(availablePkg => Object.assign(availablePkg, { status: ScenarioStatus.AVAILABLE }));

    this.setState({ scenarioPkgs: installedPkgs.concat(availablePkgs) });
  }

  async installScenarioPkg(scenarioPkg: IScenarioStorage) {
    try {
    // save scenario
      await GsfClient.fetch(HttpMethod.POST, 'scenario', scenarioPkg);
      // re-load scenario list
      await this.loadScenarios();
    }
    catch (err) {
      Modal.instance.show('Install Scenario', <p id="error">{err}</p>);
    }
  }

  async uninstallScenarioPkg(scenarioPkg) {
    try {
      // delete scenario
      await GsfClient.fetch(HttpMethod.DELETE, 'scenarios', { ids: [ scenarioPkg.id ] });
      // re-load scenario list
      await this.loadScenarios();
    }
    catch (err) {
      Modal.instance.show('Delete Scenario', <p id="error">{err}</p>);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    if (!this.state.scenarioPkgs) return null;

    return (
      <Page
        title='Scenarios'
      >
        <Table
          header={[
            {
              label: 'Name',
              render: (scenarioPkg: IAdvancedScenarioPackage) => (scenarioPkg.name),
            },
            {
              label: 'Description',
              render: (scenarioPkg: IAdvancedScenarioPackage) => (
                <span style={{ textOverflow: 'ellipsis' }}>
                  {scenarioPkg.package.description}
                </span>
              ),
            },
            {
              label: 'Homepage',
              render: (scenarioPkg: IAdvancedScenarioPackage) => (
                <a href={scenarioPkg.package.homepage} target='_blank' rel="noopener noreferrer" className='scenario-homepage'>
                  {scenarioPkg.package.homepage}
                </a>
              ),
            },
            {
              label: 'Status',
              render: (scenarioPkg: IAdvancedScenarioPackage) => (scenarioPkg.status),
            },
            {
              label: 'Actions',
              render: (scenarioPkg: IAdvancedScenarioPackage) => {
                switch (scenarioPkg.status) {
                  case ScenarioStatus.AVAILABLE:
                    return <input
                      id={`install-${scenarioPkg.name}`}
                      type='button'
                      className='btn-secondary mr-2'
                      value='Install'
                      onClick={() => this.installScenarioPkg(scenarioPkg)}
                    />;
                  case ScenarioStatus.INSTALLED:
                    return <input
                      id={`uninstall-${scenarioPkg.name}`}
                      type='button'
                      className='btn-secondary mr-2'
                      value='Uninstall'
                      onClick={() => this.uninstallScenarioPkg(scenarioPkg)}
                    />;
                  default:
                    return null;
                }
              },
            },
          ]}
          data={this.state.scenarioPkgs}
        />
      </Page>
    );
  }
}
