export default class DownloadHelper {
  static objectURLs: string[];

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
