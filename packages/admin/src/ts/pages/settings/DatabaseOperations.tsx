import * as React from 'react';
import { HttpMethod } from 'get-set-fetch-extension-commons';
import GsfClient from '../../components/GsfClient';
import Modal from '../../components/Modal';

interface IState {
  availableStores: string[];
  selectedStores: string[];
}

export default class DatabaseOperations extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      availableStores: null,
      selectedStores: [],
    };

    this.toggleStore = this.toggleStore.bind(this);
    this.importHandler = this.importHandler.bind(this);
    this.exportHandler = this.exportHandler.bind(this);
  }

  async componentDidMount() {
    const availableStores = await GsfClient.fetch<string[]>(HttpMethod.GET, 'settings/stores');
    this.setState({ availableStores });
  }

  renderStoreCheckbox(store: string) {
    return (
      <div className="form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id={store}
          checked={this.state.selectedStores.includes(store)}
          onClick={() => this.toggleStore(store)}
        />
        <label
          className="form-check-label"
          htmlFor={store}
          onClick={() => this.toggleStore(store)}
        >
          {store}
        </label>
      </div>
    );
  }

  toggleStore(store: string) {
    this.setState(state => {
      let newSelectedStores: string[];

      if (state.selectedStores.includes(store)) {
        newSelectedStores = this.state.selectedStores.filter(selectedStore => selectedStore !== store);
      }
      else {
        newSelectedStores = [ ...this.state.selectedStores, store ];
      }

      return { selectedStores: newSelectedStores };
    });
  }

  async exportHandler(evt: React.MouseEvent<HTMLAnchorElement>) {
    const { currentTarget } = evt;

    // download href has just been set don't recreate it again, allow the browser to naturally follow the download link
    if (currentTarget.hasAttribute('downloadready')) {
      currentTarget.removeAttribute('downloadready');
      return;
    }
    evt.preventDefault();

    try {
      const exportInfo: {url: string} = await GsfClient.fetch(HttpMethod.GET, 'settings/stores/export', { stores: this.state.selectedStores });

      currentTarget.href = exportInfo.url;
      currentTarget.setAttribute('downloadready', 'true');
      currentTarget.click();
    }
    catch (error) {
      Modal.instance.show('Export Object Stores', <p id="error">{error}</p>);
    }
  }

  importHandler(evt: React.ChangeEvent<HTMLInputElement>) {
    const reader = new FileReader();
    reader.readAsText(evt.target.files[0], 'UTF-8');
    reader.onload = async readEvt => {
      const content = readEvt.target.result;
      try {
        await GsfClient.fetch(HttpMethod.GET, 'settings/stores/import', { stores: this.state.selectedStores, content });
        Modal.instance.show('Import Object Stores', <p id="success" key="success">Import successful.</p>);
      }
      catch (error) {
        Modal.instance.show('Import Object Stores', <p id="error">{error}</p>);
      }
    };
    reader.onerror = () => {
      Modal.instance.show(
        'Import Object Stores',
        [
          <p key="info">Error reading file. {JSON.stringify(reader.error)}</p>,
        ],
        [
          {
            title: 'Close',
            value: 'close',
          },
        ],
      );
    };
  }

  render() {
    if (!this.state.availableStores) return null;

    return (
      <div>
        <hr/>
        <h4 className="title">Database Operations</h4>
        <div className="form-group required row">
          <label htmlFor="scenarioPkg.name" className="col-form-label col-2 col-form-label">Object Stores</label>

          <div className="col-10">
            {
              this.state.availableStores.map(availableStore => this.renderStoreCheckbox(availableStore))
            }
          </div>
        </div>

        <div className="form-group row">
          <div className="col-sm-2"></div>
          <div className="col-sm-5">

            <label id="importLabel" htmlFor="import" className="btn btn-secondary mr-2">Import</label>
            <a
              id="export"
              className='btn btn-secondary mr-2'
              href='#'
              target='_blank'
              download={'gsf-export.json'}
              onClick={this.exportHandler}
            >
              Export
            </a>
            <input
              id="import"
              type="file"
              style={{ display: 'none' }}
              onChange={this.importHandler}
              accept="application/json"
            />
          </div>
        </div>
      </div>
    );
  }
}
