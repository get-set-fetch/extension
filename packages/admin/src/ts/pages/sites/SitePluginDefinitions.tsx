import * as React from 'react';
import { IHeaderCol, IPluginDefinition } from 'get-set-fetch-extension-commons';
import Table from '../../components/Table';
import Modal from '../../components/Modal';

interface IProps {
  siteId: string;
  pluginDefinitions: IPluginDefinition[];
}

interface IState {
  header: IHeaderCol[];
  availablePlugins: IPluginDefinition[];
}

export default class SitePluginDefinitions extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Name',
          render: pluginDef => pluginDef.name,
        },
        {
          label: 'Options',
          render: pluginDef => (
            Object.keys(pluginDef.opts).length > 0
              ? Object.keys(pluginDef.opts).map(optKey => (
                <div className="form-group row" key={optKey}>
                  <label htmlFor={optKey} className="col-sm-2 col-form-label">{optKey}</label>
                  <div className="col-sm-10">
                    <input
                      id={optKey} type="text" className="form-control"
                      value={pluginDef.opts[optKey]}
                      onChange={this.changeHandler}/>
                  </div>
                </div>
              ))
              : <p>No options available</p>
          ),
        },
      ],
      availablePlugins: [],
    };
  }

  async componentDidMount() {
    try {
      const availablePlugins = await window.GsfClient.fetch('GET', 'plugins');
      this.setState({ availablePlugins });
    }
    catch (err) {
      Modal.instance.show('Load Plugins', <p id="error">{err}</p>);
    }
  }


  /* the plugins available but not already used by the current site */
  getNotUsedPluginDefinitions() {
    // const usedPluginIds = this.state.usedPlugins.map(plugin => plugin.id);
    // return this.state.availablePlugins.filter(availablePlugin => usedPluginIds.indexOf(availablePlugin.id) === -1);

    return [];
  }

  changeHandler(evt) {
    const val = evt.target.value;
    const prop = evt.target.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addPlugin(pluginId) {
  }

  render() {
    const notUsedPlugins = this.getNotUsedPluginDefinitions();

    return ([
      <Table key="pluginDefList"
        header={this.state.header} data={this.props.pluginDefinitions}
      />,


      <div className="row" key="ctrl">
        <div className="btn-group">
          <button
            type="button" className="btn btn-primary dropdown-toggle"
            data-toggle="dropdown"
            aria-haspopup="true" aria-expanded="false"
            disabled={notUsedPlugins.length === 0}>
                  Add Plugin
          </button>
          <div className="dropdown-menu">
            {
              notUsedPlugins.map(plugin => (
                <a key={plugin.id} className="dropdown-item" href="#" onClick={() => this.addPlugin(plugin.id)}>
                  {plugin.name}
                </a>
              ))
            }
          </div>
        </div>
      </div>,


    ]);
  }
}
