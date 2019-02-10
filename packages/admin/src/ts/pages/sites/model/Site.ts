import { Record } from "immutable";
import PluginDefinition from "./PluginDefinition";

interface CrawlOptions {
  delay:number;
  maxResources:number;
}

interface ResourceFilterOptions {
  maxEntries: number;
  probability: number;
}

interface SiteOptions {
  crawl:CrawlOptions;
  resourceFilter:ResourceFilterOptions;
}

interface SiteProps {
  id: string;
  name: string;
  url: string;
  pluginDefinitions: PluginDefinition[];
  opts: SiteOptions;
}

const defaultSiteProps: SiteProps = {
  id: null,
  name: null,
  url: null,
  pluginDefinitions: [],
  opts: {
    crawl: {
      delay: 200,
      maxResources: -1
    },
    resourceFilter: {
      maxEntries: 5000,
      probability: 0.01,
    },
  }
}

export default class Site extends Record(defaultSiteProps) implements SiteProps {
  public readonly id: string;
  public readonly name: string;
  public readonly url: string;

  public constructor(values?: Partial<SiteProps>) {
    values ? super(values) : super()
  }
}
