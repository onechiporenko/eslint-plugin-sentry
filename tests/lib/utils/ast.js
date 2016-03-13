/**
 * @fileoverview
 * @author Ian VanSchooten
 * @copyright 2016 Ian VanSchooten. All rights reserved.
 * See LICENSE in root directory for full license.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var expect = require("chai").expect;
var espree = require("espree");
var escodegen = require("escodegen");

var ast = require("../../../lib/utils/ast.js");

function addParents(program) {
  program.body.forEach(function (node) {
    node.parent = program;
  });
  return program;
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("ast", function () {

  describe("#getNextStatement", function () {

    beforeEach(function () {
      this.codeToParse = "if (a === b)\n\ta++;\nb++;";
      this.parsed = addParents(espree.parse(this.codeToParse));
      this.ifStatement = this.parsed.body[0];
      this.expressionStatement = this.parsed.body[1];
    });

    it("next node exists", function () {
      expect(ast.getNextStatement(this.ifStatement)).to.be.eql(this.expressionStatement);
    });

    it("next node does not exist", function () {
      expect(ast.getNextStatement(this.expressionStatement)).to.be.null;
    });

  });

  describe("#groupNodes", function () {

    [
      {
        code: "a && b",
        expected: ["a", "b"],
        operator: "&&"
      },
      {
        code: "a === b && c === d",
        expected: ["a===b", "c===d"],
        operator: "&&"
      },
      {
        code: "a && b && c",
        expected: ["a", "b", "c"],
        operator: "&&"
      },
      {
        code: "a === b && c === d && e === f",
        expected: ["a===b", "c===d", "e===f"],
        operator: "&&"
      },
      {
        code: "a && b && c && d",
        expected: ["a", "b", "c", "d"],
        operator: "&&"
      },
      {
        code: "a === b && c === d && e === f && g === h",
        expected: ["a===b", "c===d", "e===f", "g===h"],
        operator: "&&"
      },
      {
        code: "!!opt && Em.typeOf(opt.successCallback) === 'function' && opt.successCallback.call(opt.sender || this, opt.successCallbackData);",
        expected: ["!!opt", "Em.typeOf(opt.successCallback)==='function'", "opt.successCallback.call(opt.sender||this,opt.successCallbackData)"],
        operator: "&&"
      }
    ].forEach(function (test) {
      it(test.code, function () {
        var parsed = espree.parse(test.code);
        var nodes = ast.groupNodes(parsed.body[0].expression, test.operator).map(function (node) {
          return escodegen.generate(node, ast.codeGenOptions);
        });
        expect(nodes).to.be.eql(test.expected);
      });
    });

  });

});