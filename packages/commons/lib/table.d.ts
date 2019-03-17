export interface IHeaderCol {
  label: string,
  render: (row) => any;
  renderLink?: boolean;
}