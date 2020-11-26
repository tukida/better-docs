/**
 * @module jsdoc/section/resolver
 */
const env = require('jsdoc/env');
const fs = require('jsdoc/fs');
const logger = require('jsdoc/util/logger');
const path = require('path');
const stripBom = require('jsdoc/util/stripbom');
const section = require('./section');

const hasOwnProp = Object.prototype.hasOwnProperty;

// TODO: make this an instance member of `RootSection`?
const conf = {};
const finder = /^(.*)\.(x(?:ht)?ml|html?|md|markdown|json)$/i;

/** checks if `conf` is the metadata for a single section.
 * A section's metadata has a property 'title' and/or a property 'children'.
 * @param {object} json - the object we want to test (typically from JSON.parse)
 * @returns {boolean} whether `json` could be the metadata for a section.
 */
function isSectionJSON(json) {
  // if conf.title exists or conf.children exists, it is metadata for a section
  return hasOwnProp.call(json, 'title') || hasOwnProp.call(json, 'children');
}

/**
 * Root section.
 * @type {module:jsdoc/section.Root}
 */
exports.root = new section.RootSection();

exports.renewRoot = () => exports.root = new section.RootSection();


/**
 * Helper function that adds section configuration to the `conf` variable. This helps when multiple
 * section configurations are specified in one object, or when a section's children are specified
 * as section configurations as opposed to an array of section names.
 *
 * Recurses as necessary to ensure all sections are added.
 *
 * @param {string} name - if `meta` is a configuration for a single section, this is that
 * section's name.
 * @param {object} meta - object that contains section information. Can either be for a single
 * section, or for multiple (where each key in `meta` is the section name and each value is the
 * information for a single section). Additionally, a section's 'children' property may either be
 * an array of strings (names of the child sections), OR an object giving the configuration for the
 * child sections.
 */
function addSectionConf(name, meta) {
  let names;
  if (isSectionJSON(meta)) {
    // if the children are themselves section defintions as opposed to an
    // array of strings, add each child.
    if (hasOwnProp.call(meta, 'children') && !Array.isArray(meta.children)) {
      names = Object.keys(meta.children);
      for (let childName of names) {
        addSectionConf(childName, meta.children[childName]);
      }
      // replace with an array of names.
      meta.children = names;
    }
    // check if the section has already been defined...
    if (hasOwnProp.call(conf, name)) {
      logger.warn(
        `Metadata for the section ${name} is defined more than once. Only the first definition will be used.`
      );
    } else {
      conf[name] = meta;
    }
  } else {
    // keys are section names, values are `Section` instances
    names = Object.keys(meta);
    for (let sectionName of names) {
      addSectionConf(sectionName, meta[sectionName]);
    }
  }
}

/**
 * Add a section.
 * @param {module:jsdoc/section.Section} current - Section to add.
 */
exports.addSection = (current) => {
  if (exports.root.getByName(current.name)) {
    logger.warn(
      'The section %s is defined more than once. Only the first definition will be used.',
      current.name
    );
  } else {
    // by default, the root section is the parent
    current.setParent(exports.root);

    exports.root._addSection(current);
  }
};

/**
 * Load sections from the given path.
 * @param {string} filepath - Sections directory.
 */
exports.load = (filepath) => {
  let content;
  let current;
  const files = fs.ls(
    filepath,
    env.opts.recurse ? env.conf.recurseDepth : undefined
  );
  let name;
  let match;
  let type;

  // sections handling
  files.forEach((file) => {
    match = file.match(finder);

    // any filetype that can apply to sections
    if (match) {
      name = path.basename(match[1]);
      content = fs.readFileSync(file, env.opts.encoding);

      switch (match[2].toLowerCase()) {
        // HTML type
        case 'xml':
        case 'xhtml':
        case 'html':
        case 'htm':
          type = section.TYPES.HTML;
          break;

        // Markdown typs
        case 'md':
        case 'markdown':
          type = section.TYPES.MARKDOWN;
          break;

        // configuration file
        case 'json':
          addSectionConf(name, JSON.parse(stripBom.strip(content)));

          // don't add this as a section
          return;

        // how can it be? check `finder' regexp
        // not a file we want to work with
        default:
          return;
      }

      current = new section.Section(name, content, type);
      exports.addSection(current);
    }
  });
};

/**
 * Resolves hierarchical structure.
 */
exports.resolve = () => {
  let item;
  let current;

  Object.keys(conf).forEach((name) => {
    current = exports.root.getByName(name);

    // TODO: should we complain about this?
    if (!current) {
      return;
    }
    item = conf[name];

    // set title
    if (item.title) {
      current.title = item.title;
    }

    // add children
    if (item.children) {
      item.children.forEach((child) => {
        const childSection = exports.root.getByName(child);

        if (!childSection) {
          logger.error('Missing child section: %s', child);
        } else {
          childSection.setParent(current);
        }
      });
    }
  });
};
