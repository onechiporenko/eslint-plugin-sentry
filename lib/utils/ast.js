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
  var indx = -1;
  for (var i = 0; i < c; i++) {
    if (body[i] === node) {
      indx = i + 1;
      break;
    }
  }
  return o.has(body, indx) ? o.get(body, indx) : null;
}

module.exports = {
  getNextStatement: getNextStatement
};