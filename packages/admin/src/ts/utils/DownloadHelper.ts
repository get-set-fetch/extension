import ExportHelper from "./ExportHelper";

export default class DownloadHelper {
  static objectURLs: string[];

  static async exportCSV2(fetchData:Promise<object[]>, evt) {
    // store dom target for this synthetic event
    const { target } = evt;

    // download href has just been set don't recreate it again, allow the browser to naturally follow the download link
    if (target.hasAttribute('downloadready')) {
      target.removeAttribute('downloadready');
      return;
    }

    // download href is obsolete or missing, prevent browser from downloading the content
    evt.preventDefault();

    const data = await fetchData;

    // no data present
    if (data.length === 0) {
      alert('Nothing to export. No resources crawled or with valid content');
      return;
    }

    // transform data into csv
    const csv = ExportHelper.csv(data);

    // (re)create blob and anchor href for download
    DownloadHelper.revokeObjectUrl(target.href);
    DownloadHelper.createBlobURL(target, csv, 'text/plain');
    target.setAttribute('downloadready', true);
    target.click();
  }

  static async exportCSV(fetchData:Promise<object[]>, evt) {
    // store dom target for this synthetic event
    const { target } = evt;

    // download href has just been set don't recreate it again, allow the browser to naturally follow the download link
    if (target.hasAttribute('downloadready')) {
      target.removeAttribute('downloadready');
      return;
    }

    // download href is obsolete or missing, prevent browser from downloading the content
    evt.preventDefault();

    const data = await fetchData;

    // no data present
    if (data.length === 0) {
      alert('Nothing to export. No resources crawled or with valid content');
      return;
    }

    // transform data into csv
    const csv = ExportHelper.csv(data);

    // (re)create blob and anchor href for download
    DownloadHelper.revokeObjectUrl(target.href);
    DownloadHelper.createBlobURL(target, csv, 'text/plain');
    target.setAttribute('downloadready', true);
    target.click();
  }

  static createBlobURL(anchor, content, type) {
    if (!DownloadHelper.objectURLs) {
      DownloadHelper.objectURLs = [];
    }

    const blob = new Blob([content], { type });
    const blobURL = URL.createObjectURL(blob);

    DownloadHelper.objectURLs.push(blobURL);

    // eslint-disable-next-line no-param-reassign
    anchor.href = blobURL;
  }

  static revokeAllObjectUrls() {
    if (!DownloadHelper.objectURLs) return;
    DownloadHelper.objectURLs.forEach(objectURL =>
      URL.revokeObjectURL(objectURL));
  }

  static revokeObjectUrl(objectURL) {
    const idx = DownloadHelper.objectURLs && DownloadHelper.objectURLs.indexOf(objectURL);
    if (idx > -1) {
      URL.revokeObjectURL(objectURL);
      DownloadHelper.objectURLs.splice(idx, 1);
    }
  }
}
