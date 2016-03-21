/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";
var ast = require("../utils/ast.js");
var c = require("../utils/collections.js");
var o = require("object-path");
var m = "Such `condition` is already checked in the parent `If`";
var Normalizer = require("../utils/normalizer.js");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  var nestedIfs = [];
  var nestedIfsGrouped = [];

  var scopeVariables = [[]];
  var scopeLevel = 0;

  function parseIfBody(consequentBody) {
    var n = new Normalizer();
    for (var i = 0; i < consequentBody.length; i++) {
      var node = consequentBody[i].expression || {};
      if (node.type === "IfStatement") {
        break;
      }
      if (node.type !== "AssignmentExpression") {
        continue;
      }
      var variableName = ast.stringifyNode(n.proceedNode(node.left)); // a, a.b, a[b], a['b']
      if (!Array.isArray(scopeVariables[scopeLevel])) {
        scopeVariables[scopeLevel] = [];
      }
      scopeVariables[scopeLevel].push(variableName);
    }
    if (scopeVariables[scopeLevel]) {
      scopeVariables[scopeLevel] = scopeVariables[scopeLevel].sort();
    }
  }

  function parseBeforeIf (nodes) {
    var n = new Normalizer();
    var _scopeLevel = scopeLevel - 1;
    for (var i = nodes.length - 1; i >= 0; i--) {
      var node = nodes[i].expression || {};
      if (node.type === "IfStatement") {
        break;
      }
      if (node.type !== "AssignmentExpression") {
        continue;
      }
      var variableName = ast.stringifyNode(n.proceedNode(node.left));
      if (!Array.isArray(scopeVariables[_scopeLevel])) {
        scopeVariables[_scopeLevel] = [];
      }
      scopeVariables[_scopeLevel].push(variableName);
    }
    if (scopeVariables[_scopeLevel]) {
      scopeVariables[_scopeLevel] = scopeVariables[_scopeLevel].sort();
    }
  }

  return {

    "IfStatement": function (node) {
      scopeLevel++;
      var ifVars = ast.getVariables(node.test);
      var consequentBody = o.get(node, "consequent.body");
      if (consequentBody) {
        parseIfBody(consequentBody);
      }
      if (o.get(node, "parent.body.length")) {
        var indx = node.parent.body.indexOf(node); // can't be -1
        parseBeforeIf(node.parent.body.slice(0, indx));
      }
      var allConditionsVarsAreReassigned = ifVars.length && c.isSubSet(scopeVariables[scopeLevel - 1] ? scopeVariables[scopeLevel - 1] : [], ifVars);

      var operator = node.test.operator;
      var n = new Normalizer({notSwapConditionBranches: true});
      var clone = n.proceedNode(node);

      var groupedNodes = [];
      if (ast.isSimpleCondition(clone.test)) {
        groupedNodes = [{
          operator: "",
          code: ast.stringifyNode(clone.test)
        }];
      }
      else {
        groupedNodes = ast.groupNodes(clone.test, operator).map(function (_n) {
          return {
            operator: operator,
            code: ast.stringifyNode(_n)
          };
        });
      }
      var test1 = ast.stringifyNode(clone.test);
      var test2 = ast.stringifyNode(n.proceedNode(node.test));
      if (nestedIfs.indexOf(test1) !== -1 || nestedIfs.indexOf(test2) !== -1) {
        if (!allConditionsVarsAreReassigned) {
          context.report(node, m);
        }
      }
      else {
        var _grouped = [].concat.apply([], nestedIfsGrouped);
        if (c.intersect(_grouped, groupedNodes).length) {
          if (!allConditionsVarsAreReassigned) {
            context.report(node, m);
          }
        }
      }
      nestedIfs.push(test1);
      nestedIfs.push(test2);
      nestedIfsGrouped.push(groupedNodes);
    },

    "IfStatement:exit": function () {
      nestedIfs.pop();
      nestedIfs.pop();
      nestedIfsGrouped.pop();
      scopeVariables[scopeLevel] = [];
      scopeLevel--;
    }

  }

};

module.exports.schema = [];