var o = require("object-path");
/**
 * Options for `escodegen`
 * @type {{format: {compact: boolean}}}
 */
var codeGenOptions = {format: {compact: true}};

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

/**
 * `a==b && c==d && e==f` => node(node(a==b) && node(c==d)) && node(e==f) => [node(a==b), node(c==d), node(e==f)]
 *
 * @param {ASTNode} node
 * @param {string} operator
 * @returns {ASTNode[]}
 */
function groupNodes (node, operator) {
  if (["LogicalExpression", "BinaryExpression"].indexOf(node.type) !== -1 && node.operator === operator) {
    var left = groupNodes(node.left, operator);
    var right = groupNodes(node.right, operator);
    var ret = [];
    ret = ret.concat(left.length ? left : [node.left]);
    ret = ret.concat(right.length ? right : [node.right]);
    return ret;
  }
  return [];
}

module.exports = {
  codeGenOptions: codeGenOptions,
  getNextStatement: getNextStatement,
  groupNodes: groupNodes
};