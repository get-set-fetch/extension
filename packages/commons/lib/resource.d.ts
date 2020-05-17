export interface IResourceParent {
  linkText?: string;
  imgAlt?: string;
  title?: string;
}

export interface IResource {
  crawledAt: any;
  id: number;
  url: string;
  actions: string[];
  crawlInProgress: boolean;
  depth: number;
  siteId: number;
  mediaType: string;
  blob: any;
  meta: any; // contains various meta data such as img.name, width, height ...
  content: any; // contains html scrapped content
  parent?: IResourceParent;
  resourcesToAdd?: Partial<IResource>[];
}