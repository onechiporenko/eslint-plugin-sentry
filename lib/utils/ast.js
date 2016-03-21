var o = require("object-path");
var escodegen = require("escodegen");
var estraverse = require("estraverse");
var espurify = require("espurify");

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

function isSimpleCondition(node) {
  var typesToCheck = ["LogicalExpression", "BinaryExpression", "UnaryExpression"];
  return typesToCheck.indexOf(o.get(node, "left.type")) === -1 || typesToCheck.indexOf(o.get(node, "right.type")) === -1;
}

function stringifyNode(node) {
  return escodegen.generate(node, codeGenOptions);
}

function getVariables(node) {
  var names = [];
  var clone = espurify(node);
  estraverse.traverse(clone, {
    enter: function (currentNode, parentNode) {
      var currentType = currentNode.type;
      var parentType = parentNode ? parentNode.type : "";
      var obj;
      if (currentNode.__ignore) {
        return;
      }
      if (currentType === "CallExpression") {
        if (currentNode.callee.type === "Identifier") {
          currentNode.callee.__ignore = true;
        }
        if (currentNode.callee.type === "MemberExpression") {
          currentNode.callee.__ignore = true;
          currentNode.callee.property.__ignore = true;
          obj = currentNode.callee.object;
          while(obj) {
            obj.__ignore = true;
            obj = obj.object;
          }
        }
      }
      if (currentType === "MemberExpression") {
        if (parentType !== "CallExpression" && parentType !== "MemberExpression" && currentNode.object.type !== "CallExpression") {
          obj = currentNode.object;
          while (obj) {
            if (obj.type === "CallExpression") {
              return;
            }
            obj = obj.object;
          }
          names.push(stringifyNode(currentNode));
        }
      }
      if (currentType === "Identifier") {
        if (parentType !== "CallExpression" && parentType !== "MemberExpression") {
          names.push(stringifyNode(currentNode));
        }
      }
    }
  });
  return names.filter(function (item, index, self) {
    return self.indexOf(item) === index;
  }).sort();
}

module.exports = {
  codeGenOptions: codeGenOptions,
  getNextStatement: getNextStatement,
  groupNodes: groupNodes,
  isSimpleCondition: isSimpleCondition,
  stringifyNode: stringifyNode,
  getVariables: getVariables
};