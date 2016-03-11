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

  describe("#cloneNodeWithNormalizing", function () {

    [
      {
        code: "a > b",
        expected: "b<a;"
      },
      {
        code: "a >= b",
        expected: "b<=a;"
      },
      {
        code: "var a = {b: 2, a: 1}",
        expected: "var a={a:1,b:2};"
      },
      {
        code: "b===a",
        expected: "a===b;"
      },
      {
        code: "b!==a",
        expected: "a!==b;"
      },
      {
        code: "b==a",
        expected: "a==b;"
      },
      {
        code: "b!=a",
        expected: "a!=b;"
      },
      {
        code: "b*a",
        expected: "a*b;"
      },
      {
        code: "d==c && b==a",
        expected: "a==b&&c==d;"
      },
      {
        code: "d==c || b==a",
        expected: "a==b||c==d;"
      },
      {
        code: "f==e && d==c && b==a",
        expected: "a==b&&c==d&&e==f;"
      },
      {
        code: "d==c || b==a || e==f",
        expected: "a==b||c==d||e==f;"
      },
      {
        code: "for (var i = 0; i < 5; i++) a = 2",
        expected: "for(var i=0;i<5;i++){a=2;}"
      },
      {
        code: "for (var i in b) a = 2",
        expected: "for(var i in b){a=2;}"
      },
      {
        code: "for (var i of b) a = 2",
        expected: "for(var i of b){a=2;}"
      },
      {
        code: "while (i < 5) a = 2",
        expected: "while(i<5){a=2;}"
      },
      {
        code: "do a = 2; while (i < 5)",
        expected: "do{a=2;}while(i<5);"
      },
      {
        code: "if (a == 1) b = 2",
        expected: "if(1==a){b=2;}"
      },
      {
        code: "if (a == 1) {b = 2;} else b = 3",
        expected: "if(1==a){b=2;}else{b=3;}"
      },
      {
        code: "if (a == 1) b = 2; else {b = 3}",
        expected: "if(1==a){b=2;}else{b=3;}"
      },
      {
        code: "if (a == 1) b = 2; else b = 3",
        expected: "if(1==a){b=2;}else{b=3;}"
      },
      {
        code: "if (a != 1) { b = 2; } else {b = 3}",
        expected: "if(1==a){b=3;}else{b=2;}"
      },
      {
        code: "if (a != 1) { b = 2; }",
        expected: "if(1!=a){b=2;}"
      },
      {
        code: "if (a !== 1) { b = 2; } else {b = 3}",
        expected: "if(1===a){b=3;}else{b=2;}"
      },
      {
        code: "if (a !== 1) { b = 2; }",
        expected: "if(1!==a){b=2;}"
      },
      {
        code: "if (!a) { b = 2 }",
        expected: "if(!a){b=2;}"
      },
      {
        code: "var a = b !== c ? d : e;",
        expected: "var a=b===c?e:d;"
      },
      {
        code: "var a = c != b ? d : e;",
        expected: "var a=b==c?e:d;"
      },
      {
        code: "var a = !b ? c : d;",
        expected: "var a=b?d:c;"
      },
      {
        code: "a && d && c && b;",
        expected: "a&&b&&c&&d;"
      }
    ].forEach(function (test) {
      it(test.code, function () {
        var parsed = espree.parse(test.code, {ecmaVersion: 6});
        var normalized = ast.cloneNodeWithNormalizing(parsed);
        var newCode = escodegen.generate(normalized, ast.codeGenOptions);
        expect(newCode).to.be.equal(test.expected);
      });
    });

  });

});