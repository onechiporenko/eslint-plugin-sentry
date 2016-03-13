"use strict";

var rule = require("../../../lib/rules/no-reverse-nested-conditions.js"),
  RuleTester = require("eslint").RuleTester;

var ruleTester = new RuleTester({env: {es6: true}});

var m = "Such `condition` is reversed in the parent `If`";

var Jsonium = require("jsonium");
var j = new Jsonium();

var ab = [
  {A: "a == 1", B: "1 != a"},
  {A: "a != 1", B: "1 == a"},
  {A: "a === 1", B: "a !== 1"},
  {A: "a !== 1", B: "a === 1"},
  {A: "!a", B: "a"},
  {A: "a !== b && c === d", B: "a === b"},
  {A: "a !== b && c === d", B: "d !== c"},
  {A: "a !== b || c === d", B: "d !== c"}
];

var validUniqueCases = [
  {
    code:
      "if (exp1) {" +
        "if (exp2) {}" +
      "}"
  }
];

var validTestTemplates = [
  {
    code:
      "if ({{A}}) {}" +
      "someFuncCall();" +
      "if ({{B}}) {}"
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
      "if ({{A}}) {" +
        "if ({{B}}) {}" +
      "} " +
      "else {" +
        "if ({{B}}) {}" +
      "}",
    errors: [
      {message: m, type: "IfStatement"}
    ]
  }
];

ruleTester.run("no-reverse-nested-conditions", rule, {
  valid: j.setTemplates(validTestTemplates).createCombos(["code"], ab).uniqueCombos().concatCombos(validUniqueCases).getCombos(),
  invalid: j.setTemplates(invalidTestTemplates).createCombos(["code"], ab).uniqueCombos().getCombos()
});