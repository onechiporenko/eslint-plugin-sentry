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

const RedundantCondition = require("../classes/redundant_condition.js");

module.exports = function (context) {

  let logicalNode = null;

  return {
    "LogicalExpression": function (node) {
      if(logicalNode) {
        return;
      }
      logicalNode = node;
      let condition = new RedundantCondition(node);
      const result = condition.parse();
      if (result.length) {
        context.report(node, `${result.join(", ")} are redundant`);
      }
    },
    "LogicalExpression:exit": function (node) {
      if (node === logicalNode) {
        logicalNode = null;
      }
    }
  }

};

module.exports.schema = [];