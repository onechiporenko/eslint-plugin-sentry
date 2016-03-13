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

var Normalizer = require("../../../lib/utils/normalizer.js");

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("ast", function () {

  beforeEach(function () {
    this.n = new Normalizer()
  });

  describe("#proceedNode", function () {

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
        code: "b && a",
        expected: "a&&b;"
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
        code: "if (!a) { b = 2 }else {b = 3}",
        expected: "if(a){b=3;}else{b=2;}"
      },
      {
        code: "if (!!a) { b = 2 } else {b = 3}",
        expected: "if(!!a){b=2;}else{b=3;}"
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
      },
      {
        code: "a['b']",
        expected: "a.b;"
      },
      {
        code: "a['b.c']",
        expected: "a['b.c'];"
      },
      {
        code: "a['b']()",
        expected: "a.b();"
      }
    ].forEach(function (test) {
        it(test.code, function () {
          var parsed = espree.parse(test.code, {ecmaVersion: 6});
          var normalized = this.n.proceedNode(parsed);
          var newCode = escodegen.generate(normalized, ast.codeGenOptions);
          expect(newCode).to.be.equal(test.expected);
        });
      });

  });

});