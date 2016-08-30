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

var ShorthandSelfAssignment = require("../classes/shorthand_self_assignment.js");

module.exports = function (context) {

  return {
    "AssignmentExpression": function (node) {
      let assignment = new ShorthandSelfAssignment(node);
      var result = assignment.parse();
      if (result) {
        context.report(node, "Shorthand self assignment are hard to read");
      }
    }
  }

};

module.exports.schema = [];