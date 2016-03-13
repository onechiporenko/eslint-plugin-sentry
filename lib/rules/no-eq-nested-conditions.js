/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";
var ast = require("../utils/ast.js");
var o = require("object-path");
var m = "Such `condition` is already checked in the parent `If`";
var Normalizer = require("../utils/normalizer.js");
var escodegen = require("escodegen");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  var nestedIfs = [];
  var nestedIfsGrouped = [];

  function intersect(v1, v2) {
    return v1.filter(function (v1Item) {
      return v2.filter(function (v2Item) {
        return v1Item.code === v2Item.code && (v1Item.operator === v2Item.operator || !v1Item.operator || !v2Item.operator);
      }).length !== 0;
    });
  }

  function testIsSimple(test) {
    var typesToCheck = ["LogicalExpression", "BinaryExpression", "UnaryExpression"];
    return typesToCheck.indexOf(o.get(test, "left.type")) !== -1 && typesToCheck.indexOf(o.get(test, "right.type")) !== -1;
  }

  return {

    "IfStatement": function (node) {
      var operator = node.test.operator;
      var n = new Normalizer({notSwapConditionBranches: true});
      var clone  = n.proceedNode(node);
      var groupedNodes = [];
      if (testIsSimple(clone.test)) {
        groupedNodes = ast.groupNodes(clone.test, operator).map(function (_n) {
          return {
            operator: operator,
            code: escodegen.generate(_n, ast.codeGenOptions)
          };
        });
      }
      else {
        groupedNodes = [{
          operator: "",
          code: escodegen.generate(clone.test, ast.codeGenOptions)
        }];
      }
      var _test2 = n.proceedNode(node.test);
      var test1 = escodegen.generate(clone.test, ast.codeGenOptions);
      var test2 = escodegen.generate(_test2, ast.codeGenOptions);
      if (nestedIfs.indexOf(test1) !== -1 || nestedIfs.indexOf(test2) !== -1) {
        context.report(node, m);
      }
      else {
        var _grouped = [].concat.apply([], nestedIfsGrouped);
        if (intersect(_grouped, groupedNodes).length) {
          context.report(node, m);
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
    }

  }

};

module.exports.schema = [];