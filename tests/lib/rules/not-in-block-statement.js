"use strict";

var rule = require("../../../lib/rules/not-in-block-statement.js"),
  RuleTester = require("eslint").RuleTester;

var ruleTester = new RuleTester({env: {es6: true}});

var m = "Statement is not in the block-body.";

var Jsonium = require("jsonium");
var j = new Jsonium();

var cases = [
  {CODE: "if (a === b)"},
  {CODE: "while (a < b)"},
  {CODE: "for (var a = 0; a< b; a++)"},
  {CODE: "for (var a in b)"},
  {CODE: "for (var a of b)"}
];

var validTestTemplates = [
  {
    code:
      "if (a === b) { obj.method(); } obj.method2();"
  },
  {
    code:
      "if (a === b) { obj.method(); }\nobj.method2();"
  },
  {
    code:
      "if (a === b) { obj.method(); } else { obj.method2(); }"
  },
  {
    code:
      "{{CODE}} {\n\tobj.method();\n}\n\tobj.method2();"
  },
  {
    code:
      "{{CODE}} \n\tobj.method();\nobj.method2();"
  },
  {
    code:
      "{{CODE}} \n\tobj.method();\n                   obj.method2();"
  }
];

var invalidTestTemplates = [
  {
    code:
      "if (a === b)\n\tobj.method();\nelse\n\tobj.method2();\n\tobj.method3();",
    errors: [
      {message: m, type: "ExpressionStatement"}
    ]

  },
  {
    code:
      "{{CODE}}\n\tobj.method();\n\tobj.method2();",
    errors: [
      {message: m, type: "ExpressionStatement"}
    ]
  },
  {
    code:
      "{{CODE}}\n\tobj.method();\n\n\n\n\tobj.method2();",
    errors: [
      {message: m, type: "ExpressionStatement"}
    ]
  },
  {
    code:
      "{{CODE}}\n\tobj.method();\tobj.method2();",
    errors: [
      {message: m, type: "ExpressionStatement"}
    ]
  }
];

ruleTester.run("not-in-block-statement", rule, {
  valid: j.setTemplates(validTestTemplates).createCombos(["code"], cases).uniqueCombos().getCombos(),
  invalid: j.setTemplates(invalidTestTemplates).createCombos(["code"], cases).uniqueCombos().getCombos()
});