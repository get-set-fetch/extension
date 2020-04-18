import * as React from 'react';
import { setIn } from 'immutable';
import { HttpMethod, ISetting } from 'get-set-fetch-extension-commons';
import GsfClient from '../../components/GsfClient';
import Page from '../../layout/Page';

interface IState {
  settings: ISetting[];
}

export default class SettingList extends React.Component<{}, IState> {
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
    const settings: ISetting[] = await GsfClient.fetch<ISetting[]>(HttpMethod.GET, 'settings');
    this.setState({ settings });
  }

  changeHandler(evt) {
    const key = evt.target.id;
    let val = evt.target.value;
    const { type } = evt.target.dataset;

    if (type === 'int') {
      val = parseInt(val, 10);
    }

    const idx = this.state.settings.findIndex(entry => entry.key === key);
    this.setState({ settings: setIn(this.state.settings, [ idx ], { key, val }) });
  }

  async submitHandler(evt) {
    evt.preventDefault();

    this.state.settings.forEach(async (entry: ISetting) => {
      try {
        await GsfClient.fetch(HttpMethod.PUT, 'setting', { key: entry.key, val: entry.val });
      }
      catch (err) {
        console.error(`error saving setting ${entry.key}`);
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    if (!this.state.settings) return null;

    return (
      <Page title="Settings">

        <form className="form-main">
          <div className="form-group row">
            <label htmlFor="name" className="col-sm-2 col-form-label text-right">Log Level</label>
            <div className="col-sm-5">
              <select
                id="logLevel"
                className="custom-select mr-sm-2"
                data-type="int"
                onChange={this.changeHandler}
                value={this.state.settings.find(entry => entry.key === 'logLevel').val}
              >
                <option value="0">TRACE</option>
                <option value="1">DEBUG</option>
                <option value="2">INFO</option>
                <option value="3">WARNING</option>
                <option value="4">ERROR</option>
              </select>
            </div>
          </div>

          <div className="form-group row">
            <div className="col-sm-2"/>
            <div className="col-sm-5">
              <a id="save" className="btn btn-secondary" href="#" role="button" onClick={this.submitHandler}>Save</a>
            </div>
          </div>

        </form>

      </Page>
    );
  }
}
