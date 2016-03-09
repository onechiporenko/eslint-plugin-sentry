var o = require("object-path");

/**
 * @typedef {Object} ASTNode
 */

/**
 * Return next node after provided if it exists
 *
 * @param {ASTNode} node
 * @returns {?ASTNode}
 */
function getNextStatement(node) {
  var body = o.get(node, "parent.body");
  if (!body) {
    return null;
  }
  var c = body.length;
  for (var i = 0; i < c; i++) {
    if (body[i] === node) {
      return c > i + 1 ? body[i + 1] : null;
    }
  }
  return null;
}

module.exports = {
  getNextStatement: getNextStatement
};