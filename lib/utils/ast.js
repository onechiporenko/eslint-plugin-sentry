var o = require("object-path");
var escodegen = require("escodegen");

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
 *
 * @type {object}
 */
var operatorsConvertMap = {
  ">": "<",
  ">=": "<="
};

/**
 * @typedef {object} normalizedBinary
 * @property {string} left string representation for left part of the expression
 * @property {string} operator expression's operator
 * @property {string} right string representation for right part of the expression
 */
/**
 * Edit logical expressions according to the <code>operatorsConvertMap</code>
 * Swap left and right operands if it's needed
 *
 * @param {ASTNode} node
 * @return {normalizedBinary}
 */
function normalizeBinaryExpression(node) {
  var operator = node.operator;
  var leftExpression = node.left;
  var rightExpression = node.right;
  var newOperator = operatorsConvertMap[operator] || operator;
  var leftExpressionString = escodegen.generate(leftExpression, codeGenOptions);
  var rightExpressionString = escodegen.generate(rightExpression, codeGenOptions);
  if (newOperator === operator) {
    return {
      left: leftExpressionString,
      operator: newOperator,
      right: rightExpressionString
    };
  }
  return {
    left: rightExpressionString,
    operator: newOperator,
    right: leftExpressionString
  };
}

/**
 * `a==b && c==d && e==f` => node(node(a==b) && node(c==d)) && node(e==f) => [node(a==b), node(c==d), node(e==f)]
 *
 * @param {ASTNode} node
 * @param {string} operator
 * @returns {ASTNode[]}
 */
function groupNodes (node, operator) {
  if (node.type === "LogicalExpression" && node.operator === operator) {
    return [node.left, node.right].concat(groupNodes(node.left, operator)).concat(groupNodes(node.right, operator));
  }
  return [];
}

module.exports = {
  codeGenOptions: codeGenOptions,
  getNextStatement: getNextStatement,
  groupNodes: groupNodes,
  normalizeBinaryExpression: normalizeBinaryExpression
};