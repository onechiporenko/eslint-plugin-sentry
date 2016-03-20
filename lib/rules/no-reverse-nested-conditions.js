/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";
var ast = require("../utils/ast.js");
var m = "Such `condition` is reversed in the parent `If`";
var c = require("../utils/collections.js");
var Normalizer = require("../utils/normalizer.js");
var Reverser = require("../utils/reverser.js");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  var nestedIfs = [];
  var nestedIfsGrouped = [];
  var nodes = [];

  /**
   * Check if current node (IfStatement) is inside the another IfStatement (its consequent-part) or it is top-level IfStatement
   *
   * @param {ASTNode} node
   * @returns {boolean}
   */
  function isInParentConsequent(node) {
    if (!nodes.length) {
      return true;
    }
    var neededParent = nodes[nodes.length - 1];
    if (node === neededParent) {
      return true;
    }
    var parent = node.parent;
    while (parent) {
      if (parent === neededParent) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  return {

    "IfStatement": function (node) {
      var n = new Normalizer({notSwapConditionBranches: true});
      var r = new Reverser();
      if (!isInParentConsequent(node)) {
        return;
      }
      var operator = node.test.operator;
      var clone  = n.proceedNode(node);
      var groupedNodes;
      if (ast.isSimpleCondition(clone.test)) {
        clone.test = r.proceedNode(clone.test);
        groupedNodes = [{
          operator: "",
          code: ast.stringifyNode(clone.test)
        }];
      }
      else {
        groupedNodes = ast.groupNodes(clone.test, operator).map(function (_n) {
          return {
            operator: operator,
            code: ast.stringifyNode(r.proceedNode(_n))
          };
        });
      }

      var test = ast.stringifyNode(clone.test);
      if (nestedIfs.indexOf(test) !== -1) {
        context.report(node, m);
      }
      else {
        var _grouped = [].concat.apply([], nestedIfsGrouped);
        if (c.intersect(_grouped, groupedNodes).length) {
          context.report(node, m);
        }
      }
      nestedIfs.push(test);
      nestedIfsGrouped.push(groupedNodes);
      nodes.push(node.consequent);
    },

    "IfStatement:exit": function () {
      nestedIfs.pop();
      nestedIfsGrouped.pop();
      nodes.pop();
    }

  }

};

module.exports.schema = [];