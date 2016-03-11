"use strict";

var rule = require("../../../lib/rules/no-eq-nested-conditions.js"),
  RuleTester = require("eslint").RuleTester;

var ruleTester = new RuleTester({env: {es6: true}});

var m = "Such `condition` is already checked in the parent `If`";

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
      "if (exp1) {" +
        "if (exp2) {}" +
      "}"
  },
  {
    code:
      "if ({{A}}) {}" +
        "someFuncCall();" +
      "if ({{B}}) {}"
  }
];

var invalidTestTemplates = [
  {
    code:
      "if ({{A}}) {" +
        "if ({{B}}) {}" +
      "}",
    errors: [
      {message: m, type: "IfStatement"}
    ]
  },
  {
    code:
      "if ({{A}})" +
        "if ({{B}}) {}",
    errors: [
      {message: m, type: "IfStatement"}
    ]
  },
  {
    code:
      "if ({{A}}) {" +
        "if (cond)" +
          "if ({{B}}) {}" +
      "}",
    errors: [
      {message: m, type: "IfStatement"}
    ]
  },
  {
    code:
      "if ({{A}}) {} " +
      "else {" +
        "if ({{B}}) {}" +
      "}",
    errors: [
      {message: m, type: "IfStatement"}
    ]
  },
  {
    code:
      "if ({{A}}) {} " +
      "else {" +
        "if (cond) " +
          "if ({{B}}) {}" +
      "}",
    errors: [
      {message: m, type: "IfStatement"}
    ]
  },
  {
    code:
      "if ({{A}}) {" +
        "if ({{B}}) {}" +
      "} " +
      "else {" +
        "if ({{B}}) {}" +
      "}",
    errors: [
      {message: m, type: "IfStatement"},
      {message: m, type: "IfStatement"}
    ]
  }
];

ruleTester.run("no-eq-nested-conditions", rule, {
  valid: j.setTemplates(validTestTemplates).createCombos(["code"], ab).uniqueCombos().getCombos(),
  invalid: j.setTemplates(invalidTestTemplates).createCombos(["code"], ab).uniqueCombos().getCombos()
});