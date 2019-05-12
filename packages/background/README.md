# get-set-fetch-extension-background

Handles the crawling and scraping logic.

# Scraping Lifecycle
- A scraping projects starts by creating a project entity with:
  - fixed, static parameters:
    - name
    - description
    - root url(s) from where the crawling starts
    - scrape scenario
  - dynamic parameters based on scenario's provided json-schema

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
  url: "https://root-url.com",

  scenarioId: 1,
  scenarioProps: {
    description: "Extract Html Content scenario is used for extracting html nodes text based on dom selectors."
    homepage: "https://github.com/get-set-fetch/extension/tree/master/packages/scenarios/extract-html-content"
    maxDepth: "1"
    selectors: "h1↵h2↵h3"
  },

  pluginDefinitions: [
    {
      name: "SelectResourcePlugin"
    },
    {
      name: "FetchPlugin"
    },
    {
      name: "ExtractUrlsPlugin",
      opts: {
        maxDepth: 1
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
      name: "InsertResourcePlugin"
    },
  ]
}
```

## Project Entity Notes
scenarioProps field represents the user defined settings for the project selected scenario extract-html-content.
These settings are used by the scenario to generate partial pluginDefinitions.

# Site Entity Example
```json
{
  id: 1,
  name: "projectA-1",
  url: "https://root-url.com",
  projectId: 1,
  pluginDefinitions: [
    {
      name: "SelectResourcePlugin"
    },
    {
      name: "FetchPlugin"
    },
    {
      name: "ExtractUrlsPlugin",
      opts: {
        maxDepth: 1
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
      name: "InsertResourcePlugin"
    },
  ]
  resourceFilter: Uint8Array
}
```

## Site Entity Notes
Each site inherits the parent project partial pluginDefinitions. This allows to easily create multiple sites with the same configuration under a common project followed by individual changes to each site.
Resource filter is a bloom filter used for detecting duplicate urls.

# Plugin Instances
```json
[
    {
      name: "SelectResourcePlugin",
      opts: {
        crawlFrequency: -1
      }
    },
    {
      name: "FetchPlugin"
    },
    {
      name: "ExtractUrlsPlugin",
      opts: {
        extensionRe: null,
        allowNoExtension: true,
        maxDepth: 1,
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
      name: "InsertResourcePlugin"
    },
  ]
  ```

  The above plugin configuration will only crawl html resources starting from the root url

  ## Plugin Instances Notes
  - SelectResourcePlugin
    - selects an un-crawled / expired resource from the database
    - crawlFrequency: how often a resource should be re-crawled in hours. A value of -1 will never re-crawl an already crawled resource.
  - FetchPlugin
    - opens html resources in a new tab or dowloads binary ones.
  - ExtractUrlsPlugin
    - runInTab = true : whether or not resources the plugin should be executed in the browser tab context where the current resource is opened.
    - extensionRe: what other resources (defined as regexp) besides html ones should be crawled
    - allowNoExtension: whether or not resources without extension should be crawled
    - maxDepth: how deep the crawl should advance. A value of 0 means crawling just the root url. A value of 1 will crawl the root url and direct internal links present in the root url.
  - ExtractHtmlContentPlugin
    - selectors: One or multiple selectors separated by new line. Scraping is achieved by invoking document.querySelectorAll with each selector.
  - UpdateResourcePlugin
    - saves a crawled resource to the database. For html resources, scraping content is saved under resource.info property. For binary ones, fetched content is available under resource.blob.
  - InsertResourcePlugin
    - saved to database newly found resources based on the current resource links, image tags, etc..

 # Export Capabilties
 Each project resources can be exported either as csv for html resources or zip for binary ones.

# Limitations
- each project supports a single root url
- site modification only partially supported

# Roadmap
- add scenario templates capable of automatically populating scenario parameters for easier scrape settings sharing
- manage project scrape status: in-progress, stopped, complete, ...
