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

});