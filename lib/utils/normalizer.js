var o = require("object-path");
var ast = require("./ast.js");
var espree = require("espree");
var escodegen = require("escodegen");
var espurify = require("espurify");
var estraverse = require("estraverse");

/**
 * @typedef {object} normalizerConfig
 * @property {boolean} notSwapConditionBranches
 */

/**
 * @typedef {object} normalizedBinary
 * @property {string} left string representation for left part of the expression
 * @property {string} operator expression's operator
 * @property {string} right string representation for right part of the expression
 */

/**
 *
 * @type {object}
 */
var operatorsConvertMap = {
  ">": "<",
  ">=": "<="
};

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


function Normalizer(config) {
  if (typeof config === "object") {
    this.config = config;
  }
}

Normalizer.prototype = {

  /**
   * @type {normalizerConfig}
   */
  config: {},

  constructor: Normalizer,

  /**
   *
   * @param {ASTNode} currentNode
   * @returns {ASTNode}
   */
  _normalizeObject: function (currentNode) {
    currentNode.properties = currentNode.properties.sort(function (p1, p2) {
      return p1.key.name > p2.key.name;
    });
    return currentNode;
  },

  /**
   *
   * @param {ASTNode} currentNode
   * @returns {ASTNode}
   */
  _normalizeBinary: function (currentNode) {
    var operator = currentNode.operator;
    var newOperator = operatorsConvertMap[operator] || operator;
    if (newOperator !== operator) {
      currentNode.operator = newOperator;
      currentNode = _swapKeys(currentNode, "left", "right");
    }
    if (["===", "==", "!==", "!=", "*"].indexOf(operator) !== -1) {
      var strLeft = escodegen.generate(currentNode.left, ast.codeGenOptions);
      var strRight = escodegen.generate(currentNode.right, ast.codeGenOptions);
      if (strLeft > strRight) {
        currentNode = _swapKeys(currentNode, "left", "right");
      }
    }
    return currentNode;
  },

  /**
   *
   * @param {ASTNode} currentNode
   * @returns {ASTNode}
   */
  _normalizeIf: function (currentNode) {
    if (currentNode.consequent.type !== "BlockStatement") {
      currentNode.consequent = _convertExpressionToBlock(currentNode.consequent);
    }
    if (currentNode.alternate !== null && currentNode.alternate.type !== "BlockStatement") {
      currentNode.alternate = _convertExpressionToBlock(currentNode.alternate);
    }
    return this._normalizeTernary(currentNode);
  },

  /**
   *
   * @param {ASTNode} currentNode
   * @returns {ASTNode}
   */
  _normalizeLoop: function (currentNode) {
    if (currentNode.body.type !== "BlockStatement") {
      currentNode.body = _convertExpressionToBlock(currentNode.body);
    }
    return currentNode;
  },

  /**
   *
   * @param {ASTNode} currentNode
   * @param {string} operator
   * @returns {ASTNode}
   */
  _resetGroupedNode: function (currentNode, operator) {
    var nodes = ast.groupNodes(currentNode, operator);
    nodes = nodes.map(function (node) {
      return escodegen.generate(node, ast.codeGenOptions);
    }).sort().join(operator);
    currentNode = espree.parse(nodes).body[0].expression;
    return currentNode;
  },

  /**
   *
   * @param {ASTNode} currentNode
   * @returns {ASTNode}
   */
  _normalizeTernary: function (currentNode) {
    if (this.config.notSwapConditionBranches) {
      return;
    }
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
  },

  /**
   *
   * @param {ASTNode} currentNode
   * @returns {ASTNode}
   */
  _normalizeMemberExpression: function (currentNode) {
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
  },

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
  proceedNode: function (node) {
    var clone = espurify(node);
    var self = this;
    estraverse.replace(clone, {
      leave: function (currentNode) {
        var currentNodeType = currentNode.type;
        if (currentNodeType === "ObjectExpression") {
          currentNode = self._normalizeObject(currentNode);
        }
        if (currentNodeType === "BinaryExpression") {
          currentNode = self._normalizeBinary(currentNode);
        }
        if (currentNodeType === "LogicalExpression") {
          currentNode = self._resetGroupedNode(currentNode, currentNode.operator);
        }
        if (["WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement"].indexOf(currentNodeType) !== -1) {
          currentNode = self._normalizeLoop(currentNode);
        }
        if (currentNodeType === "IfStatement") {
          currentNode = self._normalizeIf(currentNode);
        }
        if (currentNodeType === "ConditionalExpression") {
          currentNode = self._normalizeTernary(currentNode);
        }
        if (currentNodeType === "MemberExpression") {
          currentNode = self._normalizeMemberExpression(currentNode);
        }
        return currentNode;
      }
    });

    return clone;
  },

  /**
   * Edit logical expressions according to the <code>operatorsConvertMap</code>
   * Swap left and right operands if it's needed
   *
   * @param {ASTNode} node
   * @return {normalizedBinary}
   */
  normalizeBinaryExpression: function (node) {
    var operator = node.operator;
    var leftExpression = node.left;
    var rightExpression = node.right;
    var newOperator = operatorsConvertMap[operator] || operator;
    var leftExpressionString = escodegen.generate(leftExpression, ast.codeGenOptions);
    var rightExpressionString = escodegen.generate(rightExpression, ast.codeGenOptions);
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
};

module.exports = Normalizer;