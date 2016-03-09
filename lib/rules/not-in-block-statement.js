/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";
var ast = require("../utils/ast.js");
var o = require("object-path");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  function check(node, body) {
    var type = o.get(node, body + ".type");
    if (type === "BlockExpression" || type === "BlockStatement") {
      return;
    }
    var statementCoordinates = o.get(node, body + ".loc.start");
    var nextStatement = ast.getNextStatement(node);
    if (nextStatement) {
      var nextStatementCoordinates = nextStatement.loc.start;
      if (statementCoordinates.line === nextStatementCoordinates.line || statementCoordinates.column === nextStatementCoordinates.column) {
        context.report(nextStatement, "Statement is not in the block-body.");
      }
    }
  }

  return {

    "IfStatement": function (node) {
      if (o.get(node, "alternate")) {
        return check(node, "alternate");
      }
      else {
        return check(node, "consequent");
      }
    },
    "WhileStatement": function (node) {return check(node, "body")},
    "ForStatement": function (node) {return check(node, "body")},
    "ForOfStatement": function (node) {return check(node, "body")},
    "ForInStatement": function (node) {return check(node, "body")}

  }

};

module.exports.schema = [];