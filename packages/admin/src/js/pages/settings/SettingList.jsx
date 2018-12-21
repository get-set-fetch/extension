import React from 'react';
import { setIn } from 'immutable';
import GsfClient from '../../components/GsfClient';

export default class SettingList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      settings: null,
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);
  }

  componentDidMount() {
    this.loadSettings();
  }

  async loadSettings() {
    const settings = {};
    const data = await GsfClient.fetch('GET', 'settings');
    data.forEach((row) => {
      settings[row.key] = row.val;
    });
    console.log(settings);
    this.setState({ settings });
  }

  changeHandler(evt) {
    const key = evt.target.id;
    let val = evt.target.value;
    const { type } = evt.target.dataset;

    if (type === 'int') {
      val = parseInt(val, 10);
    }

    this.setState({ settings: setIn(this.state.settings, [key], val) });
  }

  async submitHandler(evt) {
    evt.preventDefault();

    Array.from(Object.keys(this.state.settings)).forEach(async (key) => {
      try {
        await GsfClient.fetch('PUT', 'setting', { key, val: this.state.settings[key] });
      }
      catch (err) {
        console.log(`error saving setting ${key}`);
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    if (!this.state.settings) return null;

    return (
      <form onSubmit={this.submitHandler}>
        <div className="form-group row">
          <label htmlFor="name" className="col-sm-2 col-form-label">Log Level</label>
          <div className="col-sm-10">
          <select
            id="logLevel"
            className="custom-select custom-select-lg mb-3"
            data-type="int"
            onChange={this.changeHandler}
            value={this.state.settings.logLevel}
            >
              <option value="0">TRACE</option>
              <option value="1">DEBUG</option>
              <option value="2">INFO</option>
              <option value="3">WARNING</option>
              <option value="4">ERROR</option>
            </select>
          </div>
        </div>
        <button id="save" type="submit" className="btn btn-primary">Save</button>
      </form>
    );
  }
}
