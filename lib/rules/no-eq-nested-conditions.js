/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";
var ast = require("../utils/ast.js");
var c = require("../utils/collections.js");
var m = "Such `condition` is already checked in the parent `If`";
var Normalizer = require("../utils/normalizer.js");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  var nestedIfs = [];
  var nestedIfsGrouped = [];

  return {

    "IfStatement": function (node) {
      var operator = node.test.operator;
      var n = new Normalizer({notSwapConditionBranches: true});
      var clone  = n.proceedNode(node);
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
      var _test2 = n.proceedNode(node.test);
      var test1 = ast.stringifyNode(clone.test);
      var test2 = ast.stringifyNode(_test2);
      if (nestedIfs.indexOf(test1) !== -1 || nestedIfs.indexOf(test2) !== -1) {
        context.report(node, m);
      }
      else {
        var _grouped = [].concat.apply([], nestedIfsGrouped);
        if (c.intersect(_grouped, groupedNodes).length) {
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