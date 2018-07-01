import React from 'react';
import PropTypes from 'prop-types';

export default class Table extends React.Component {
  static get propTypes() {
    return {
      header: PropTypes.arrayOf(PropTypes.object),
      data: PropTypes.arrayOf(PropTypes.object),
    };
  }

  static get defaultProps() {
    return {
      header: [],
      data: [],
    };
  }

  render() {
    return (
      <table className="table table-hover table-fixed">
        <thead className="blue-grey lighten-4">
          <tr>
            {
              this.props.header.map(hr => <th key={hr.label}>{hr.label}</th>)
            }
          </tr>
        </thead>
        <tbody>
          {
            this.props.data.map(row => (
              <tr key={row.toString()}>
                {
                  this.props.header.map(hr => (
                    hr.render ? hr.render(row) : <td>{row[hr.prop]}</td>
                  ))
                }
              </tr>
            ))
          }
        </tbody>
      </table>
    );
  }
}
