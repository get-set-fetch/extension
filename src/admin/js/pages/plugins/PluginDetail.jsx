import React from 'react';
import PropTypes from 'prop-types';
import { setIn } from 'immutable';
import GsfClient from '../../components/GsfClient';

export default class PluginDetail extends React.Component {
  static get propTypes() {
    return {
      pluginId: PropTypes.string,
      history: PropTypes.shape({
        push: PropTypes.func,
      }),
      match: PropTypes.shape({
        params: PropTypes.shape({
          pluginId: PropTypes.string,
        }),
      }),
    };
  }

  static get defaultProps() {
    return {
      pluginId: '',
      history: {
        push: () => {},
      },
      match: {
        params: {
          pluginId: null,
        },
      },
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      plugin: {
        name: '',
        code: '',
      },
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);
  }

  async componentDidMount() {
    const { pluginId } = this.props.match.params;

    if (this.props.match.params.pluginId) {
      try {
        const plugin = await GsfClient.fetch('GET', `plugin/${pluginId}`);
        this.setState({ plugin });
      }
      catch (err) {
        console.log('error loading plugin');
      }
    }
  }

  changeHandler(evt) {
    const val = evt.target.value;
    const prop = evt.target.id;
    this.setState({ plugin: setIn(this.state.plugin, [prop], val) });
  }

  async submitHandler(evt) {
    evt.preventDefault();

    try {
      await GsfClient.fetch('POST', 'plugin', this.state.plugin);
      this.props.history.push('/plugins');
    }
    catch (err) {
      console.log('error saving plugin');
    }
  }

  render() {
    return (
    <form onSubmit={this.submitHandler}>
      <div className="form-group row">
          <label htmlFor="name" className="col-sm-2 col-form-label">Plugin Name</label>
          <div className="col-sm-10">
            <input
              id="name" type="text" className="form-control"
              value={this.state.plugin.name}
              onChange={this.changeHandler.bind(this)}/>
          </div>
        </div>
      <div className="form-group row">
        <label htmlFor="code" className="col-sm-2 col-form-label">Plugin Code</label>
        <div className="col-sm-10">
          <textarea
            id="code" type="text" className="form-control"
            value={this.state.plugin.code}
            onChange={this.changeHandler.bind(this)}/>
        </div>
      </div>
      <button id="save" type="submit" className="btn btn-primary">Save</button>
      <button id="cancel" type="button" className="btn btn-secondary" onClick={() => this.props.history.push('/plugins')}>Cancel</button>
    </form>
    );
  }
}
