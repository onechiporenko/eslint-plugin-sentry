/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";
var ast = require("../utils/ast.js");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  function check(node, body) {
    if (node[body].type === "BlockExpression") {
      return;
    }
    var ifStatementCoordinates = node[body].loc.start;
    var afterIfStatement = ast.getNextStatement(node);
    if (afterIfStatement) {
      var afterIfStatementCoordinates = afterIfStatement.loc.start;
      if (ifStatementCoordinates.line === afterIfStatementCoordinates.line || ifStatementCoordinates.column === afterIfStatementCoordinates.column) {
        context.report(afterIfStatement, "Statement is not in the block-body.");
      }
    }
  }

  return {

    "IfStatement": function (node) {return check(node, "consequent")},
    "WhileStatement": function (node) {return check(node, "body")},
    "ForStatement": function (node) {return check(node, "body")},
    "ForOfStatement": function (node) {return check(node, "body")},
    "ForInStatement": function (node) {return check(node, "body")}

  }

};

module.exports.schema = [];