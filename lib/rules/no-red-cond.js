/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

var RedundantCondition = require("../classes/redundant_condition.js");

module.exports = function (context) {

  var insideLogicalExpression = false;

  function check(node) {
    let condition = new RedundantCondition(node.test);
    var result = condition.parse();
    if (result.length) {
      context.report(node, `${result.join(", ")} are redundant`);
    }
  }

  return {
    "IfStatement": check,
    "ConditionalExpression": check,
    "LogicalExpression": function (node) {
      if(insideLogicalExpression) {
        return;
      }
      insideLogicalExpression = true;
      check({test: node});
    },
    "LogicalExpression:exit": function () {
      insideLogicalExpression = false;
    }
  }

};

module.exports.schema = [];