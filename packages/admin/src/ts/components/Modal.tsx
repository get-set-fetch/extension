import * as React from 'react';
import ReactDOM from 'react-dom';

export interface IModalAction {
  title: string;
  value: string;
  clickHandler?: (evt: React.MouseEvent<HTMLButtonElement>) => void;
  close?: boolean;
}

interface IState {
  title: string;
  content: JSX.Element[];
  actions: IModalAction[];
  show: boolean;
  resolve: (val: string) => void;
}

export default class Modal extends React.Component<{}, IState> {
  static instance;
  modalContainer: HTMLDivElement;

  constructor(props) {
    super(props);

    this.state = {
      title: null,
      content: null,
      actions: [],
      show: false,
      resolve: null,
    };

    this.modalContainer = document.createElement('div');
    this.modalContainer.className = 'modal';

    this.hide = this.hide.bind(this);
    this.actionHandler = this.actionHandler.bind(this);
  }

  async show(title: string, content: JSX.Element[], actions: IModalAction[]): Promise<string> {
    this.modalContainer.style.display = 'block';
    return new Promise(resolve => Modal.instance.setState({ title, content, actions, resolve }));
  }

  hide() {
    // need to control the parent modal container, to toggle its visibility on/off, updating the child modal is not enough
    this.modalContainer.style.display = 'none';
  }

  componentDidMount() {
    Modal.instance = this;
    document.body.appendChild(this.modalContainer);
  }

  componentWillUnmount() {
    document.body.removeChild(this.modalContainer);
  }


  actionHandler(evt: React.MouseEvent<HTMLButtonElement>) {
    const action = this.state.actions.find(act => act.value === evt.currentTarget.dataset.val);

    // in addition to the value being returned to the modal caller, a custom handler may be invoked
    if (action.clickHandler) {
      action.clickHandler(evt);
    }

    // clicking on an modal button may or may not clause the popup
    if (action.close !== false) {
      this.hide();
    }

    this.state.resolve(action.value);
  }

  render() {
    return ReactDOM.createPortal(
      <React.Fragment>
        <div className="modal-bkg" onClick={this.hide}/>
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{this.state.title}</h5>
            </div>
            <div className="modal-body">
              {this.state.content}
            </div>
            <div className="modal-footer">
              {
                this.state.actions.map(
                  action => <input
                    key={action.value}
                    type="button"
                    className="btn-secondary mr-2"
                    value={action.title}
                    onClick={this.actionHandler}
                    data-val={action.value}
                  />,
                )
              }
            </div>
          </div>
        </div>
      </React.Fragment>,
      this.modalContainer,
    );
  }
}
