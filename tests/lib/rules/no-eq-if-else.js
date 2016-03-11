"use strict";

var rule = require("../../../lib/rules/no-eq-if-else.js"),
  RuleTester = require("eslint").RuleTester;

var ruleTester = new RuleTester({env: {es6: true}});

var Jsonium = require("jsonium");
var j = new Jsonium();
var m = "`Consequent` and `Alternate` parts look like the same";

var validSingleConditions = [
  {IF: "a = 1;", ELSE: "a = 2;"},
  {IF: "a - b;", ELSE: "b - a;"},
  {IF: "a / b;", ELSE: "b / a;"},
  {IF: "a >> b;", ELSE: "b >> a;"},
  {IF: "a << b;", ELSE: "b << a;"},
  {IF: "!a == b;", ELSE: "!b == a;"},
  {IF: "~a == b;", ELSE: "~b == a;"},
  {IF: "!a !== b;", ELSE: "!b !== a;"},
  {IF: "~a !== b;", ELSE: "~b !== a;"},
  {IF: "!a === b;", ELSE: "!b === a;"},
  {IF: "~a === b;", ELSE: "~b === a;"},
  {IF: "!a != b;", ELSE: "!b != a;"},
  {IF: "~a != b;", ELSE: "~b != a;"},
  {IF: "a instanceof b;", ELSE: "b instanceof a;"},
  {IF: "typeof a == b;", ELSE: "typeof b == a;"},
  {IF: "a ? b : c;", ELSE: "a ? c : b;"},
  {IF: "new Date(a);", ELSE: "new Date(b);"},
  {IF: "var a = {a: 1, b: 2};", ELSE: "var a = {a: 1, c: 2};"},
  {IF: "var a = this.func({a: 1, b: 2});", ELSE: "var a = this.func({a: 1, c: 2});"},
  {IF: "var a = func(a, b, c);", ELSE: "var a = func(c, b, a);"},
  {IF: "var f = b && a || c;", ELSE: "var f = a && c || b;"},
  {IF: "var f = b + a + c;", ELSE: "var f = a + c + b;"}, // valid because it may be strings concatenation
  {IF: "var f = b + 'd' + a + c;", ELSE: "var f = a + c + b + 'd';"},
  {IF: "var f = (d || b) && a || c;", ELSE: "var f = c || a && (b && d);"}
];

var invalidSingleConditions = [
  {IF: "a = 1;", ELSE: "a = 1;"},
  {IF: "/*some comment*/ a = 1;", ELSE: "// some comment 2\na = 1;"},
  {IF: "a = '1';", ELSE: "a = \"1\";"},
  {IF: "a = {a: 1, b: 2};", ELSE: "a = {a: 1, b: 2};"},
  {IF: "a = {a: 1, b: 2};", ELSE: "a = {b: 2, a: 1};"},
  {IF: "a = this.func({a: 1, b: 2});", ELSE: "a = this.func({b: 2, a: 1});"},
  {IF: "a = new Date();", ELSE: "a = new Date();"},
  {IF: "b < a;", ELSE: "a > b;"},
  {IF: "b <= a;", ELSE: "a >= b;"},
  {IF: "b === a;", ELSE: "a === b;"},
  {IF: "b == a;", ELSE: "a == b;"},
  {IF: "b !== a;", ELSE: "a !== b;"},
  {IF: "b != a;", ELSE: "a != b;"},
  {IF: "b * a;", ELSE: "a * b;"},
  {IF: "var f = b && a && c;", ELSE: "var f = a && c && b;"},
  {IF: "var f = b && d && a && c;", ELSE: "var f = a && c && b && d;"},
  {IF: "var f = b || d || a || c;", ELSE: "var f = a || c || b || d;"},
  {IF: "var f = b && a || c;", ELSE: "var f = c || a && b;"},
  {IF: "var f = d || b && a || c;", ELSE: "var f = c || a && b || d;"},
  {IF: "var f = (d || b) && a || c;", ELSE: "var f = c || a && (b || d);"},
  {IF: "while(a < 1) {b = 2;}", ELSE: "while(a < 1) {b = 2;}"},
  {IF: "while(a < 1) {b = 2;}", ELSE: "while(a < 1) b = 2;"},
  {IF: "do {b = 2;} while (a < 1)", ELSE: "do b = 2; while (a < 1)"},
  {IF: "do b = 2; while (a < 1)", ELSE: "do {b = 2;} while (a < 1)"},
  {IF: "for (var a = 0; a < b; a++) {b = 2;}", ELSE: "for (var a = 0; a < b; a++) b = 2;"},
  {IF: "for (var a = 0; a < b; a++) b = 2;", ELSE: "for (var a = 0; a < b; a++) {b = 2;}"},
  {IF: "for (var a of b) {b = 2;}", ELSE: "for (var a of b) b = 2;"},
  {IF: "for (var a of b) b = 2;", ELSE: "for (var a of b) {b = 2;}"},
  {IF: "for (var a in b) {b = 2;}", ELSE: "for (var a in b) b = 2;"},
  {IF: "for (var a in b) b = 2;", ELSE: "for (var a in b) {b = 2;}"},
  {IF: "var a = b ? d : e;", ELSE: "var a = b ? d : e;"},
  {IF: "var a = !b ? e : d;", ELSE: "var a = b ? d : e;"},
  {IF: "var a = b === c ? d : e;", ELSE: "var a = b !== c ? e : d;"},
  {IF: "var a = b === c ? (d === e ? f : g) : h;", ELSE: "var a = b !== c ? h : (d !== e ? g : f);"},
  {IF: "var a = b == c ? d : e;", ELSE: "var a = b != c ? e : d;"}
];

var invalidMultipleConditions = [
  {IF: "a = 1; b = 2;", ELSE: "a = 1; b = 2;"},
  {IF: "if (a == 1) v = 2;", ELSE: "if (a == 1) {v = 2;}"},
  {IF: "if (a == 1) {v = 2;}", ELSE: "if (1 == a) {v = 2;}"},
  {IF: "if (a == 1) {if (b == 2) {v = 3;}}", ELSE: "if (1 == a) {if (2 == b) {v = 3;}}"},
  {IF: "if (a == 1) {v = 2;}", ELSE: "if (a == 1) v = 2;"},
  {IF: "if (a == 1) v = 2;", ELSE: "if (a == 1) v = 2;"},
  {IF: "if (a == 1) {v = 2;}", ELSE: "if (a == 1) {v = 2;}"}
];

var singleCases = [
  {CODE: "if (condition) { {{IF}} } else { {{ELSE}} }"},
  {CODE: "if (condition) { {{IF}} } else  {{ELSE}} "},
  {CODE: "if (condition) {{IF}} else { {{ELSE}} }"},
  {CODE: "if (condition) {{IF}} else {{ELSE}}"}
];

var multipleCases = [
  singleCases[0] // `if`, `else` are blocks
];

var validTestCases = j
  .setTemplates(singleCases)
  .createCombos(["CODE"], validSingleConditions)
  .getCombos();

var invalidTestCases = j
  .setTemplates(singleCases)
  .createCombos(["CODE"], invalidSingleConditions)
  .getCombos();
invalidTestCases = j
  .setTemplates(multipleCases)
  .createCombos(["CODE"], invalidMultipleConditions)
  .uniqueCombos()
  .concatCombos(invalidTestCases)
  .getCombos();

var validTestTemplates = [
  {
    code:
      "{{CODE}}"
  }
];

var invalidTestTemplates = [
  {
    code:
      "{{CODE}}",
    errors: [
      {message: m, type: "IfStatement"}
    ]
  }
];

ruleTester.run("no-eq-if-else", rule, {
  valid: j
    .setTemplates(validTestTemplates)
    .createCombos(["code"], validTestCases)
    .uniqueCombos()
    .getCombos(),
  invalid: j
    .setTemplates(invalidTestTemplates)
    .createCombos(["code"], invalidTestCases)
    .uniqueCombos()
    .getCombos()
});