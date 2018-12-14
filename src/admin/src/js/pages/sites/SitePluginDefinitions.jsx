import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import Table from '../../components/Table';

export default class SitePlugins extends React.Component {
  static get propTypes() {
    return {
      siteId: PropTypes.string,
      pluginDefinitions: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        opts: PropTypes.object,
      })),
    };
  }

  static get defaultProps() {
    return {
      siteId: '',
      pluginDefinitions: [],
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Name',
          render: pluginDef => (<td><NavLink to={`/plugin/${pluginDef.id}`} className="nav-link">{pluginDef.name}</NavLink></td>),
        },
        {
          label: 'Options',
          render: pluginDef => (
            <td>
            {
              Object.keys(pluginDef.opts).length > 0 ?
                Object.keys(pluginDef.opts).map(optKey => (
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
              :
                <p>No options available</p>
            }
            </td>
          ),
        },
      ],
      availablePlugins: [],
    };
  }

  async componentDidMount() {
    const availablePlugins = await GsfClient.fetch('GET', 'plugins');
    this.setState({ availablePlugins });
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
    console.log(`${prop} : ${val}`);
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
