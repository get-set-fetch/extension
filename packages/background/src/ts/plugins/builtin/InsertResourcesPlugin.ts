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
      description: 'saves new resources within the current project based on newly identified urls.',
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
    return resource.resourcesToAdd && resource.resourcesToAdd.length > 0;
  }

  async apply(site: ISite & IdbSite, resource: Partial<IResource>) {
    let resourcesAdded = false;
    let resourceRedirect = false;

    // initialize filter
    if (!this.bloomFilter) {
      this.bloomFilter = BloomFilter.create(this.opts.maxEntries, this.opts.probability, site.resourceFilter);

      // 1st time a bloom filter is created for this site, add site.url as the 1st resource already added to be scraped
      if (!site.resourceFilter) {
        this.bloomFilter.add(site.url);
        resourcesAdded = true;
      }
    }

    // handle new resources
    const { resourcesToAdd } = resource;

    if (resourcesToAdd && resourcesToAdd.length > 0) {
      // filter resources
      const resources: Partial<IResource>[] = [];
      resourcesToAdd.forEach(resourceToAdd => {
        if (this.bloomFilter.test(resourceToAdd.url) === false) {
          resources.push({ siteId: site.id, url: resourceToAdd.url, depth: resource.depth + 1, parent: resourceToAdd.parent });
          this.bloomFilter.add(resourceToAdd.url);
        }
      });

      if (resources.length > 0) {
        await site.saveResources(resources);
        resourcesAdded = true;
      }
    }

    /*
    handle redirects
    if the current resource.url is not present in the filter, means the url changed as a result of a redirect
    */
    if (this.bloomFilter.test(resource.url) === false) {
      this.bloomFilter.add(resource.url);
      resourceRedirect = true;
    }

    // if new resources have been added or redirect occurred, update the site bloom filter with the latest one
    if (resourcesAdded || resourceRedirect) {
      // eslint-disable-next-line no-param-reassign
      site.resourceFilter = this.bloomFilter.bitset;
    }
  }
}
