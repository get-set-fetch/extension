# get-set-fetch-extension-background

Handles the crawling and scraping logic.

# Scraping Lifecycle
- A scraping projects starts by creating a project entity with:
  - fixed, static parameters:
    - name
    - description
    - root url(s) from where the crawling starts
    - crawl options
    - scrape scenario
  - dynamic scrape parameters based on scenario's provided json-schema

- When a project is saved it also creates a site entity for each entered root url (see limitations).
- A site contains a series of plugin definitions populated based on the selected scenario. A scenario can reference existing, builtin plugins or define new ones.
- Crawling / scraping happens at site level with plugin definitions being instantiated into plugin instances.
- Plugin instances are executed in the defined order against the current scraping resource (html page).


# Project Entity Example
```json
{
  id: 1,
  name: "projectA",
  description: "projectA description",
  url: "https://root-url",

  scenario: "extract-html-content",

  plugins: [
    {
      name: "SelectResourcePlugin",
      opts: {
        delay: 1000
      }
    },
    {
      name: "FetchPlugin"
    },
    {
      name: "ExtractUrlsPlugin",
      opts: {
        maxDepth: 1,
        maxResources: 10,
        selectors: "a"
      }
    },
    {
      name: "ExtractHtmlContentPlugin",
      opts: {
        selectors: "h1↵h2↵h3"
      }
    },
    {
      name: "UpdateResourcePlugin"
    },
    {
      name: "InsertResourcesPlugin",
      opts: {
        maxResources: 100
      }
    }
  ]
}
```

## Project Entity Notes


# Site Entity Example
```json
{
  id: 1,
  name: "projectA-1",
  url: "https://root-url.com",
  projectId: 1,

  scenario: "ExtractHtmlResources",

  plugins: [
    {
      name: "SelectResourcePlugin",
      opts: {
        delay: 1000
      }
    },
    {
      name: "FetchPlugin"
    },
    {
      name: "ExtractUrlsPlugin",
      opts: {
        maxDepth: 1,
        maxResources: 10,
        selectors: "a"
      }
    },
    {
      name: "ExtractHtmlContentPlugin",
      opts: {
        selectors: "h1↵h2↵h3"
      }
    },
    {
      name: "UpdateResourcePlugin"
    },
    {
      name: "InsertResourcesPlugin",
      opts: {
        maxResources: 100
      }
    },
  ]
  resourceFilter: Uint8Array
}
```

## Site Entity Notes
Each site inherits the parent project plugin definitions. This allows to easily create multiple sites with the same configuration under a common project followed by individual changes to each site.
Resource filter is a bloom filter used for detecting duplicate urls.

# Plugin Instances
```json
[
    {
      name: "SelectResourcePlugin",
      opts: {
        frequency: -1
      }
    },
    {
      name: "FetchPlugin"
    },
    {
      name: "ExtractUrlsPlugin",
      opts: {
        maxDepth: 1,
        maxResources: 10,
        selectors: "a"
        runInTab: true
      }
    },
    {
      name: "ExtractHtmlContentPlugin",
      opts: {
        selectors: "h1↵h2↵h3"
      }
    },
    {
      name: "UpdateResourcePlugin"
    },
    {
      name: "InsertResourcesPlugin",
      opts: {
        maxResources: 100
      }
    },
  ]
  ```

  The above plugin configuration will only crawl html resources starting from the root url

  ## Plugin Instances Notes
  - SelectResourcePlugin
    - selects an un-crawled / expired resource from the database
    - frequency: how often a resource should be re-crawled in hours. A value of -1 will never re-crawl an already crawled resource.
  - FetchPlugin
    - opens html resources in a new tab or dowloads binary ones.
  - ExtractUrlsPlugin
    - runInTab = true : whether or not the plugin should be executed in the browser tab context where the current resource is opened.
    - maxResources: how many resources to crawl
    - maxDepth: how deep the crawl should advance. A value of 0 means crawling just the root url. A value of 1 will crawl the root url and direct internal links present in the root url.
  - ExtractHtmlContentPlugin
    - selectors: One or multiple selectors separated by new line. Scraping is achieved by invoking document.querySelectorAll with each selector.
  - UpdateResourcePlugin
    - saves a crawled resource to the database. For html resources, scraping content is saved under resource.info property. For binary ones, fetched content is available under resource.blob.
  - InsertResourcesPlugin
    - saved to database newly found resources based on the current resource links, image tags, etc..

 # Export Capabilties
 Each project resources can be exported either as csv for html resources or zip for binary ones.

# Limitations
- each project supports a single root url
- site updates are currently disabled

# Roadmap
- add scenario templates capable of automatically populating scenario parameters for easier scrape settings sharing
- manage project scrape status: in-progress, stopped, complete, ...
