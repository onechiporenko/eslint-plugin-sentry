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

var ShorthandAssignment = require("../classes/shorthand_assignment.js");

module.exports = function (context) {

  return {
    "AssignmentExpression": function (node) {
      let assignment = new ShorthandAssignment(node);
      var result = assignment.parse();
      if (result) {
        context.report(node, "Looks like `a =+ b` is used instead of `a += b` (same for `=-`)");
      }
    }
  }

};

module.exports.schema = [];