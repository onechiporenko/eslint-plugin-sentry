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
  {A: "a < b", B: "b > a"},
  {A: "a <= b", B: "b >= a"},
  {A: "this.a('b')", B: "this.a('b')"},
  {A: "a['b']", B: "a.b"},
  {A: "!a", B: "!a||!b"},
  {A: "a === b && c === d", B: "b === a && e === f"},
  {A: "a === b && c === d", B: "e === f && b === a"},
  {A: "!a && c === d", B: "e === f && !a"},
  {A: "a['v'] === b.a && c === d", B: "e === f && b.a === a.v"},
  {A: "a[v] === b.a && c === d", B: "e === f && b.a === a[v]"},
  {A: "a * b === b * c && c * d === e * f", B: "b*c === b*a && c*d === f * e"}
];

var validUnique = [
  {
    code:
      "if (a === b && c === d) {" +
        "if (a === b || c === d) {}" +
      "}"
  },
  {
    code:
      "if (a) {" +
        "if (!a || !b) {}" +
      "} " +
      "else {}"
  },
  {
    code:
      "if (a === b) {" +
        "if (a === c) {}" +
      "}"
  },
  {
    code:
      "if (a['v'] === a[v]) {" +
        "if (a['v'] === a.v) {}" +
      "}"
  },
  {
    code:
      "if (a === 1) { " +
        "a = 2;" +
        "if (a == 1) {}" +
      "}"
  },
  {
    code:
      "if (a === 1) { " +
        "a = 2;" +
        "if (a == 1) {}" +
      "}"
  },
  {
    code:
      "if (a === 1 && b === 2) { " +
        "a = 2;" +
        "b = 1;" +
        "c = 3;" +
        "if (a == 1 && b === 2) {}" +
      "}"
  },
  {
    code:
      "if (a === 1) {" +
        "f.forEach(function () {" +
          "a = 2; " +
          "if (a === 1){}" +
        "});" +
      "}"
  }
];

var invalidUnique = [
  {
    code:
      "if (a === 1 && b === 2) { " +
        "if (a == 1 && b === 2) {}" +
      "} " +
      "else {" +
        "a = 2;" +
        "b = 1;" +
        "c = 3;" +
      "}",
    errors: [
      {message: m, type: "IfStatement"}
    ]
  }
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
  valid: j.setTemplates(validTestTemplates).createCombos(["code"], ab).uniqueCombos().concatCombos(validUnique).getCombos(),
  invalid: j.setTemplates(invalidTestTemplates).createCombos(["code"], ab).uniqueCombos().concatCombos(invalidUnique).getCombos()
});