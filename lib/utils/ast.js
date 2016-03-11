var o = require("object-path");
var espree = require("espree");
var escodegen = require("escodegen");
var espurify = require("espurify");
var estraverse = require("estraverse");

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

/**
 *
 * @param {ASTNode} node
 * @param {string} key1
 * @param {string} key2
 * @returns {ASTNode}
 * @private
 */
function _swapKeys(node, key1, key2) {
  var tmp = node[key1];
  node[key1] = node[key2];
  node[key2] = tmp;
  return node;
}

/**
 *
 * @param {ASTNode} currentNode
 * @param {string} operator
 * @returns {ASTNode}
 * @private
 */
function _resetGroupedNode(currentNode, operator) {
  var nodes = groupNodes(currentNode, operator);
  nodes = nodes.map(function (node) {
    return escodegen.generate(node, codeGenOptions);
  }).sort().join(operator);
  currentNode = espree.parse(nodes).body[0].expression;
  return currentNode;
}

/**
 *
 * @param {ASTNode} expression
 * @returns {{type: string, body: ASTNode[]}}
 * @private
 */
function _convertExpressionToBlock(expression) {
  return {
    type: "BlockStatement",
    body: [expression]
  };
}

/**
 *
 * @param {ASTNode} currentNode
 * @returns {ASTNode}
 * @private
 */
function _normalizeObject(currentNode) {
  currentNode.properties = currentNode.properties.sort(function (p1, p2) {
    return p1.key.name > p2.key.name;
  });
  return currentNode;
}

/**
 *
 * @param {ASTNode} currentNode
 * @returns {ASTNode}
 * @private
 */
function _normalizeBinary (currentNode) {
  var operator = currentNode.operator;
  var newOperator = operatorsConvertMap[operator] || operator;
  if (newOperator !== operator) {
    currentNode.operator = newOperator;
    currentNode = _swapKeys(currentNode, "left", "right");
  }
  if (["===", "==", "!==", "!=", "*"].indexOf(operator) !== -1) {
    var strLeft = escodegen.generate(currentNode.left, codeGenOptions);
    var strRight = escodegen.generate(currentNode.right, codeGenOptions);
    if (strLeft > strRight) {
      currentNode = _swapKeys(currentNode, "left", "right");
    }
  }
  return currentNode;
}

/**
 *
 * @param {ASTNode} currentNode
 * @returns {ASTNode}
 * @private
 */
function _normalizeLoop (currentNode) {
  if (currentNode.body.type !== "BlockStatement") {
    currentNode.body = _convertExpressionToBlock(currentNode.body);
  }
  return currentNode;
}

/**
 *
 * @param {ASTNode} currentNode
 * @returns {ASTNode}
 * @private
 */
function _normalizeIf (currentNode) {
  if (currentNode.consequent.type !== "BlockStatement") {
    currentNode.consequent = _convertExpressionToBlock(currentNode.consequent);
  }
  if (currentNode.alternate !== null && currentNode.alternate.type !== "BlockStatement") {
    currentNode.alternate = _convertExpressionToBlock(currentNode.alternate);
  }
  return _normalizeTernary(currentNode);
}

/**
 *
 * @param {ASTNode} currentNode
 * @returns {ASTNode}
 * @private
 */
function _normalizeMemberExpression (currentNode) {
  var valueTester = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/; // https://github.com/eslint/eslint/blob/master/lib/rules/dot-notation.js
  if (o.has(currentNode, "property.value")) {
    var value = currentNode.property.value;
    if (valueTester.test(value)) {
      currentNode.property.name = value;
      currentNode.property.type = "Identifier";
      currentNode.computed = false;
      delete currentNode.property.value;
      delete currentNode.property.raw;
    }
  }
  return currentNode;
}

/**
 *
 * @param {ASTNode} currentNode
 * @returns {ASTNode}
 * @private
 */
function _normalizeTernary (currentNode) {
  var operator, newOperator;
  if (currentNode.test.type === "BinaryExpression") {
    operator = currentNode.test.operator;
    var _map = {
      "!==": "===",
      "!=": "=="
    };
    newOperator = _map[operator] || operator;
    if (newOperator !== operator && currentNode.alternate !== null) { // `consequent` can't be null after `if`-`else` swapping
      currentNode.test.operator = newOperator;
      currentNode = _swapKeys(currentNode, "consequent", "alternate");
    }
  }
  if (currentNode.test.type === "UnaryExpression" && currentNode.test.argument.type !== "UnaryExpression") {
    operator = currentNode.test.operator;
    if (operator === "!" && currentNode.alternate !== null) { // `consequent` can't be null after `if`-`else` swapping
      currentNode.test.operator = "";
      currentNode = _swapKeys(currentNode, "consequent", "alternate");
    }
  }
  return currentNode;
}

/**
 * Clone provided node and normalize some its parts
 * <code>ObjectExpression</code> - sort properties by the key name
 *
 * <code>BinaryExpression</code> - change operator from &lt; or &lt;= (if &gt; or &gt;= is used)
 *  replace operands in the lexical order if operator is someone from list - '===', '==', '!==', '!=', '*'
 *
 * <code>LogicalExpression</code> - try to group its parts in the lexical order (if possible) - <code>b && c && a</code> will be <code>a && b && c</code>
 *  and <code>d == c && f == e && b == a</code> will be <code>a == b && c == d && e && f</code>
 *
 * <code>"LoopStatements"</code> - wrap it body to the BlockExpression if it is not a block
 *
 * <code>ConditionalExpression</code> - replace operand in the `test` if it is BinaryExpression from '!==' to '===' or from '!=' to '==' and swap `consequent`
 *  and `alternate`. If `test` is UnaryExpression and it's operator is '!', `consequent` and `alternate` are swapped too
 *
 * <code>IfStatement</code> - wrap `consequent` and `alternate` parts if they are not blocks and then normalize this statement as <code>ConditionalExpression</code>
 *
 * <code>MemberExpression</code> - replace <code>a['b']['c']</code> to the <code>a.b.c</code>
 *
 * @param {ASTNode} node node to clone and normalize
 * @return {ASTNode} node's clone with normalized expressions
 */
function cloneNodeWithNormalizing(node) {
  var clone = espurify(node);
  estraverse.replace(clone, {
    leave: function (currentNode) {
      var currentNodeType = currentNode.type;
      if (currentNodeType === "ObjectExpression") {
        currentNode = _normalizeObject(currentNode);
      }
      if (currentNodeType === "BinaryExpression") {
        currentNode = _normalizeBinary(currentNode);
      }
      if (currentNodeType === "LogicalExpression") {
        currentNode = _resetGroupedNode(currentNode, currentNode.operator);
      }
      if (["WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement"].indexOf(currentNodeType) !== -1) {
        currentNode = _normalizeLoop(currentNode);
      }
      if (currentNodeType === "IfStatement") {
        currentNode = _normalizeIf(currentNode);
      }
      if (currentNodeType === "ConditionalExpression") {
        currentNode = _normalizeTernary(currentNode);
      }
      if (currentNodeType === "MemberExpression") {
        currentNode = _normalizeMemberExpression(currentNode);
      }
      return currentNode;
    }
  });

  return clone;
}

/**
 * Detects if node is inside function used like argument
 * Example:
 * <pre>
 *   a.b(1, 2, 3, function () {
 *    test(); // --- is inside callback
 *   });
 * </pre>
 *
 * @param {ASTNode} node
 * @returns {boolean}
 */
function isInsideCallback(node) {
  var func = o.get(node, "parent.parent");
  if (!func || func.type !== "FunctionExpression") {
    return false;
  }
  var call = func.parent;
  if (!call || !call.arguments) {
    return false;
  }
  return call.arguments.indexOf(func) !== -1;
}

module.exports = {
  codeGenOptions: codeGenOptions,
  getNextStatement: getNextStatement,
  groupNodes: groupNodes,
  normalizeBinaryExpression: normalizeBinaryExpression,
  cloneNodeWithNormalizing: cloneNodeWithNormalizing,
  isInsideCallback: isInsideCallback
};