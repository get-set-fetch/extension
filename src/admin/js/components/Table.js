import React from 'react';

export default class Table extends React.Component {
  render() {
    return (
      <table className="table table-hover table-fixed">
        <thead className="blue-grey lighten-4">
          <tr>
            {
              this.props.header.map(hr => <th>{hr.label}</th>)
            }
          </tr>
        </thead>
        <tbody>
          {
            this.props.data &&
            this.props.data.map &&
            this.props.data.map(row => (
              <tr>
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
