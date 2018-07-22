export default class ExportHelper {
  static csv(data, fieldSep = ',', lineSep = '\n') {
    if (!data || data.length < 1) return '';

    const header = Object.keys(data[0]).join(fieldSep);
    const body = data.map(row => Object.values(row).join(fieldSep)).join(lineSep);

    return `${header}${lineSep}${body}`;
  }
}
