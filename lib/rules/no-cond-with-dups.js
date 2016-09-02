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

const ConditionWithDuplicates = require("../classes/condition_with_duplicates.js");

module.exports = function (context) {

  const options = context.options[0] || {};
  const withoutNesting = !!options.withoutNesting;
  let logicalNode = null;

  function fEnter(node) {
    if(logicalNode) {
      return;
    }
    logicalNode = node;
    let condition = new ConditionWithDuplicates(node);
    const result = condition.parse();
    if (result.length) {
      context.report(node, `${result.join(", ")} are duplicated`);
    }
  }

  function fExit(node) {
    if (withoutNesting) {
      logicalNode = null;
      return;
    }
    if (node === logicalNode) {
      logicalNode = null;
    }
  }

  return {

    "LogicalExpression": fEnter,
    "BinaryExpression": fEnter,
    "LogicalExpression:exit": fExit,
    "BinaryExpression:exit": fExit
  }

};

module.exports.schema = [
  {
    type: "object",
    properties: {
      withoutNesting: {
        type: "boolean"
      }
    },
    additionalProperties: false
  }
];