import { BasePlugin, ISite, IResource, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';
import BloomFilter from 'get-set-fetch/lib/filters/bloom/BloomFilter';
import IdbSite from '../../storage/IdbSite';
import IdbResource from '../../storage/IdbResource';

/**
 * Plugin responsible for saving new resources within the current site.
 */
export default class InsertResourcesPlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Insert Resources Plugin',
      description: 'responsible for saving new resources within the current site / project.',
      properties: {
        maxEntries: {
          type: 'integer',
          const: 5000,
          description: 'a bloom filter is used to test whether resources have already been scraped or not. maxEntries affects bloom filter storage.',
        },
        probability: {
          type: 'number',
          const: 0.01,
          description: 'a bloom filter is used to test whether resources have already been scraped or not. probability affects bloom filter storage.',
        },
      },
      required: [ 'maxEntries', 'probability' ],
    };
  }

  opts: {
    maxEntries: number;
    probability: number;
  };

  bloomFilter: BloomFilter;

  test(site: ISite, resource: IResource & IdbResource) {
    // only save new urls of a currently crawled resource
    if (!resource || !resource.crawlInProgress) return false;

    // only save new urls if there's something to save
    return resource.urlsToAdd && resource.urlsToAdd.length > 0;
  }

  async apply(site: ISite & IdbSite, resource) {
    let resourcesAdded = false;

    if (!this.bloomFilter) {
      this.bloomFilter = BloomFilter.create(this.opts.maxEntries, this.opts.probability, site.resourceFilter);

      // 1st time a bloom filter is created for this site, add site.url as the 1st resource already added to be scraped
      if (!site.resourceFilter) {
        this.bloomFilter.add(site.url);
        resourcesAdded = true;
      }
    }

    const { urlsToAdd } = resource;

    if (urlsToAdd && urlsToAdd.length > 0) {
      // filter resources
      const resources: Partial<IResource>[] = [];
      urlsToAdd.forEach(url => {
        if (this.bloomFilter.test(url) === false) {
          resources.push({ siteId: site.id, url, depth: resource.depth + 1 });
          this.bloomFilter.add(url);
        }
      });

      if (resources.length > 0) {
        await site.saveResources(resources);
        resourcesAdded = true;
      }
    }

    // if new resources have been added, update the site bloom filter with the latest one
    if (resourcesAdded) {
      // eslint-disable-next-line no-param-reassign
      site.resourceFilter = this.bloomFilter.bitset;
    }
  }
}
