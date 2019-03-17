export interface IResource {
  crawledAt: any;
  id: number;
  url: string;
  crawlInProgress: boolean;
  depth: number;
  siteId: number;
  mediaType: string;
  blob: any;
  info: any;
}