"use strict";

var rule = require("../../../lib/rules/no-same-test-in-next-if.js"),
  RuleTester = require("eslint").RuleTester;

var ruleTester = new RuleTester({env: {es6: true}});

var m = "Next `If` has same `condition` as this one";

var Jsonium = require("jsonium");
var j = new Jsonium();

var ab = [
  {A: "a == 1", B: "1 == a"},
  {A: "a != 1", B: "1 != a"},
  {A: "a !== 1", B: "1 !== a"},
  {A: "a === 1", B: "1 === a"},
  {A: "a && b", B: "b && a"},
  {A: "a && b && c", B: "b && c && a"},
  {A: "a || b", B: "b || a"},
  {A: "a || b || c", B: "b || c || a"},
  {A: "a * b", B: "b * a"},
  {A: "this.a('b')", B: "this.a('b')"},
  {A: "a['b']", B: "a.b"}
];

var validTestTemplates = [
  {
    code:
      "if (exp1) {}" +
      "if (exp2) {}"
  },
  {
    code:
      "exp1 ? a : b;" +
      "exp2 ? a : b;"
  },
  {
    code:
      "if ({{A}}) {}" +
      "someFuncCall();" +
      "if ({{B}}) {}"
  },
  {
    code:
      "({{A}}) ? a : b;" +
      "someFuncCall();" +
      "({{B}}) ? a : b;"
  }
];

var invalidTestTemplates = [
  {
    code:
      "if ({{A}}) {}" +
      "if ({{B}}) {}",
    errors: [
      {message: m, type: "IfStatement"}
    ]
  },
  {
    code:
      "({{A}}) ? a : b;" +
      "({{B}}) ? a : b;",
    errors: [
      {message: m, type: "ConditionalExpression"}
    ]
  }
];

ruleTester.run("no-same-test-in-next-if", rule, {
  valid: j.setTemplates(validTestTemplates).createCombos(["code"], ab).uniqueCombos().getCombos(),
  invalid: j.setTemplates(invalidTestTemplates).createCombos(["code"], ab).uniqueCombos().getCombos()
});