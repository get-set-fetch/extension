import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { IHeaderCol } from 'get-set-fetch-extension-commons';

interface IProps {
  header: IHeaderCol[];
  data: any[];
  emptyTableMsg?: string;
  rowLink?: (row) => string;
}

export default class Table extends React.Component<IProps, {}> {
  static defaultProps = {
    selectedRows: [],
    header: [],
    data: [],
    emptyTableMsg: 'No entries found',
    ahref: null,
  };

  render() {
    if (!this.props.data || this.props.data.length === 0) {
      return (
        <p id='no-entries' className='ml-4'><i>{this.props.emptyTableMsg}</i></p>
      );
    }

    return (
      <table className='table table-hover table-main'>
        <thead>
          <tr>
            {
              this.props.header.map(col => <th key={col.label}>{col.label}</th>)
            }
          </tr>
        </thead>
        <tbody>
          {
            this.props.data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {
                  this.props.header.map((col, idx) => this.renderCell(row, col, idx))
                }
              </tr>
            ))
          }
        </tbody>
      </table>
    );
  }

  renderCell(row, col, idx) {
    return idx === 0 ? this.renderThCell(row, col, idx) : this.renderTdCell(row, col, idx);
  }

  renderThCell(row, col, idx) {
    return <th key={idx}>{this.renderCellContent(row, col)}</th>;
  }

  renderTdCell(row, col, idx) {
    return <td key={idx}>{this.renderCellContent(row, col)}</td>;
  }

  renderCellContent(row, col) {
    if (typeof this.props.rowLink !== 'function' || col.renderLink === false) {
      return col.render(row);
    }

    return <NavLink to={this.props.rowLink(row)} className='btn-block'>{col.render(row)}</NavLink>;
  }
}
