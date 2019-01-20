import * as React from 'react';

interface IProps {
  onRowSelectionChange?:  (idx:number) => void;
  onHeaderSelectionChange?:  (evt: React.ChangeEvent<HTMLInputElement>) => void;
  selectedRows: number[];
  header: any[];
  data: any[];
  emptyTableMsg:string;
}

export default class Table extends React.Component<IProps, {}> {
  static defaultProps = {
    selectedRows: [],
    header: [],
    data: [],
    emptyTableMsg: 'No entries found',
  };

  constructor(props) {
    super(props);
    this.onCheckboxChange = this.onCheckboxChange.bind(this);
  }

  static toggleSelection(selectedRows, toggleRow) {
    const finalSelection = selectedRows.slice();

    const idx = finalSelection.indexOf(toggleRow);
    if (idx !== -1) {
      finalSelection.splice(idx, 1);
    }
    else {
      finalSelection.push(toggleRow);
    }

    return finalSelection;
  }

  onCheckboxChange(evt) {
    const selectedIdx = parseInt(evt.target.value, 10);
    this.props.onRowSelectionChange(selectedIdx);
  }

  render() {
    return this.props.data && this.props.data.length > 0 ? this.renderTable() : this.renderEmptyMsg();
  }

  renderTable() {
    return (
      <table className="table table-hover table-fixed">
        <thead className="blue-grey lighten-4">
          <tr>
            {
              this.props.onHeaderSelectionChange && <th key="checkbox">
              <input
                className="form-check-input"
                type="checkbox"
                onChange={this.props.onHeaderSelectionChange}
                checked={this.props.selectedRows.length === this.props.data.length}
              />
            </th>
            }
            {
              this.props.header.map(hr => <th key={hr.label}>{hr.label}</th>)
            }
          </tr>
        </thead>
        <tbody>
          {
            this.props.data.map((row, rowIdx) => (
              <tr key={row.toString()}>
                {
                  this.props.onRowSelectionChange &&
                  <td>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value={rowIdx}
                      onChange={this.onCheckboxChange}
                      checked={this.props.selectedRows.indexOf(rowIdx) !== -1}
                    />
                </td>
                }
                {
                  this.props.header.map(hr => (hr.render ? hr.render(row) : <td>{row[hr.prop]}</td>))
                }
              </tr>
            ))
          }
        </tbody>
      </table>
    );
  }

  renderEmptyMsg() {
    return <p><i>{this.props.emptyTableMsg}</i></p>;
  }
}
