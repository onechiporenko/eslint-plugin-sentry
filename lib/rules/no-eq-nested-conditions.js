/**
 * @fileoverview
 * @author onechiporenko
 * @copyright 2016 onechiporenko. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict";
var ast = require("../utils/ast.js");
var m = "Such `condition` is already checked in the parent `If`";
var escodegen = require("escodegen");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  var nestedIfs = [];

  return {

    "IfStatement": function (node) {
      var test1 = escodegen.generate(ast.cloneNodeWithNormalizing(node).test, ast.codeGenOptions);
      var test2 = escodegen.generate(ast.cloneNodeWithNormalizing(node.test), ast.codeGenOptions);
      if (nestedIfs.indexOf(test1) !== -1 || nestedIfs.indexOf(test2) !== -1) {
        context.report(node, m);
      }
      nestedIfs.push(test1);
      nestedIfs.push(test2);
    },

    "IfStatement:exit": function () {
      nestedIfs.pop();
      nestedIfs.pop();
    }

  }

};

module.exports.schema = [];