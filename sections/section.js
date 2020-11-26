/**
 * @module jsdoc/section
 */
const markdown = require('jsdoc/util/markdown');

const hasOwnProp = Object.prototype.hasOwnProperty;

/**
 * Removes child section from the parent. Does *not* unset child.parent though.
 *
 * @param {Section} parent - parent section.
 * @param {Section} child - Old child.
 * @private
 */
function removeChild({ children }, child) {
  const index = children.indexOf(child);

  if (index !== -1) {
    children.splice(index, 1);
  }
}

/**
 * Adds a child to the parent section. Does *not* set child.parent though.
 *
 * @param {Section} parent - parent section.
 * @param {Section} child - New child.
 * @private
 */
function addChild({ children }, child) {
  children.push(child);
}

/**
 * Represents a single JSDoc section.
 */
class Section {
  /**
     * @param {string} name - Section name.
     * @param {string} content - Text content.
     * @param {number} type - Source formating.

     */
  constructor(name, content, type) {
    this.title = this.name = this.longname = name;
    this.content = content;
    this.type = type;

    // default values
    this.parent = null;
    this.children = [];
  }

  /**
   * Moves children from current parent to different one.
   *
   * @param {?Section} parent - New parent. If null, the section has no parent.
   */
  setParent(parent) {
    // removes node from old parent
    if (this.parent) {
      removeChild(this.parent, this);
    }

    this.parent = parent;
    if (parent) {
      addChild(parent, this);
    }
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Removes children from current node.
   *
   * @param {Section} child - Old child.
   */
  removeChild(child) {
    child.setParent(null);
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Adds new children to current node.
   *
   * @param {Section} child - New child.
   */
  addChild(child) {
    child.setParent(this);
  }

  /**
   * Prepares source.
   *
   * @return {string} HTML source.
   */
  parse() {
    switch (this.type) {
      // nothing to do
      case exports.TYPES.HTML:
        return this.content;

      // markdown
      case exports.TYPES.MARKDOWN:
        return markdown.getParser()(this.content);

      // uhm... should we react somehow?
      // if not then this case can be merged with TYPES.HTML
      default:
        return this.content;
    }
  }
}
exports.Section = Section;

/**
 * Represents the root section.
 * @extends {module:jsdoc/section.Section}
 */
class RootSection extends Section {
  constructor() {
    super('', '', null);

    this._sections = {};
  }

  /**
   * Retrieve a section by name.
   * @param {string} name - Section name.
   * @return {module:jsdoc/section.Section} Section instance.
   */
  getByName(name) {
    return hasOwnProp.call(this._sections, name) && this._sections[name];
  }

  /**
   * Add a child section to the root.
   * @param {module:jsdoc/section.Section} child - Child section.
   */
  _addSection(child) {
    this._sections[child.name] = child;
  }
}
exports.RootSection = RootSection;

/**
 * Section source types.
 *
 * @enum {number}
 */
exports.TYPES = {
  HTML: 1,
  MARKDOWN: 2
};
