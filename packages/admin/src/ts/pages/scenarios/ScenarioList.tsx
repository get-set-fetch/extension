import * as React from 'react';
import GsfClient from '../../components/GsfClient';
import { HttpMethod, IHeaderCol } from 'get-set-fetch-extension-commons';
import Page from '../../layout/Page';
import Table from '../../components/Table';
import { IScenarioPackage } from 'get-set-fetch-extension-commons/lib/scenario';

interface IState {
  scenarioPkgs: IScenarioPackage[];
  header: IHeaderCol[];
}

export default class ScenarioList extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Name',
          render: (scenarioPkg: IScenarioPackage) => (scenarioPkg.name)
        },
        {
          label: 'Description',
          render: (scenarioPkg: IScenarioPackage) => (<span style={{ textOverflow: 'ellipsis' }}>{scenarioPkg.package.description.substr(0, 100)}</span>)
        },
        {
          label: 'Homepage',
          render: (scenarioPkg: IScenarioPackage) => (<a href={scenarioPkg.package.homepage} target='_blank'>{scenarioPkg.package.homepage}</a>)
        }
      ],
      scenarioPkgs: []
    };
  }

  componentDidMount() {
    this.loadScenarioPackages();
  }

  async loadScenarioPackages() {
    // get installed scenario packages
    const installedPkgs: IScenarioPackage[] = (await GsfClient.fetch(HttpMethod.GET, 'scenarios')) as IScenarioPackage[];
    const installedPkgNames = installedPkgs.map(pkg => pkg.name);

    // get available scenario packages, only show the not already installed ones
    let availablePkgs: IScenarioPackage[] = (await GsfClient.fetch(HttpMethod.GET, 'scenarios/available')) as IScenarioPackage[];
    availablePkgs = availablePkgs.filter(pkg => installedPkgNames.indexOf(pkg.name) === -1);

    const scenarioPkgs = installedPkgs.concat(availablePkgs);
    this.setState({ scenarioPkgs });
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    if (!this.state.scenarioPkgs) return null;

    return (
      <Page
        title='Available Scenarios'
        >
        <Table
          header={this.state.header}
          data={this.state.scenarioPkgs}
        />
      </Page>
    );
  }
}
