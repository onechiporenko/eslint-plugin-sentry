//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var Condition = require("../../../lib/classes/condition.js");
var vars = require("../../../lib/vars.js");
var expect = require("chai").expect;
var espree = require("espree");
var escodegen = require("escodegen");

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

function parseExpression(code) {
  return espree.parse(code).body[0].expression;
}


describe("#Condition", function () {

  describe("#constructor", function() {
    it("should set `conditionNode`", function () {
      var code = parseExpression("a === 1 && b === 2");
      var condition = new Condition(code);
      expect(condition.conditionNode).to.be.eql(code);
    });
  });

  describe("#normalize", function () {

    it("original condition node is not changed", function () {
      var code = parseExpression("a === b");
      var condition = new Condition(code);
      condition.normalize();
      expect(condition.conditionNode).to.be.eql(code);
    });

    [
      {
        c: "a == 1",
        e: "a==1"
      },
      {
        c: "a != 1",
        e: "a!=1"
      },
      {
        c: "a === 1",
        e: "a===1"
      },
      {
        c: "a !== 1",
        e: "a!==1"
      },
      {
        c: "1 == a",
        e: "a==1"
      },
      {
        c: "1 === a",
        e: "a===1"
      },
      {
        c: "a > 1",
        e: "a>1"
      },
      {
        c: "1 < a",
        e: "a>1"
      },
      {
        c: "1 <= a",
        e: "a>=1"
      },
      {
        c: "a <= 1",
        e: "1>=a"
      },
      {
        c: "1 >= a",
        e: "1>=a"
      },
      {
        c: "a == b && c == d",
        e: "d==c&&b==a"
      },
      {
        c: "a == b && (c == d || e == f)",
        e: "(f==e||d==c)&&b==a"
      },
      {
        c: "!a",
        e: "!a"
      },
      {
        c: "!a || b",
        e: "b||!a"
      },
      {
        c: "!a === b",
        e: "b===!a"
      }
    ].forEach(function (test) {
      it(JSON.stringify(test.c), function () {
        var code = parseExpression(test.c);
        var condition = new Condition(code);
        var normalizedConditionNode = condition.normalize();
        expect(escodegen.generate(normalizedConditionNode, vars.codeGenOptions)).to.be.equal(test.e);
      });
    });

  });

  describe("#getOperands", function () {
    [
      {
        c: "!a",
        e: {
          "!a": "__1"
        }
      },
      {
        c: "a.b == 1",
        e: {
          "a.b==1": "__1"
        }
      },
      {
        c: "a.b() == 1",
        e: {
          "a.b()==1": "__1"
        }
      },
      {
        c: "a == 1",
        e: {
          "a==1": "__1"
        }
      },
      {
        c: "a == 1 && b==1",
        e: {
          "a==1": "__2",
          "b==1": "__1"
        }
      },
      {
        c: "a == 1 || b==1 || 1==a",
        e: {
          "a==1": "__2",
          "b==1": "__1"
        }
      },
      {
        c: "(a == 1 || b==1) && 1==a",
        e: {
          "a==1": "__2",
          "b==1": "__1"
        }
      },
      {
        c: "a == 1 || (b!=1 && 1==a)",
        e: {
          "a==1": "__2",
          "b!=1": "__1"
        }
      },
      {
        c: "a >= 1 || (b!=1 && 1<=a)",
        e: {
          "a>=1": "__2",
          "b!=1": "__1"
        }
      },
      {
        c: "a != b && b != c",
        e: {
          "b!=a": "__2",
          "c!=b": "__1"
        }
      }
    ].forEach(function (test) {
      it(JSON.stringify(test.c), function () {
        var code = parseExpression(test.c);
        var condition = new Condition(code);
        code = condition.normalize();
        condition.getOperands(code);
        expect(condition.operands).to.be.eql(test.e);
      });
    });
  });

  describe("#replaceOperands", function () {
    [
      {
        c: "!a",
        e: "__1"
      },
      {
        c: "a.b == 1",
        e: "__1"
      },
      {
        c: "a.b() == 1",
        e: "__1"
      },
      {
        c: "a == 1 && b==1",
        e: "__1&&__2"
      },
      {
        c: "a == 1 || b==1 || 1==a",
        e: "__1||__2||__2"
      },
      {
        c: "(a == 1 || b==1) && 1==a",
        e: "(__1||__2)&&__2"
      },
      {
        c: "a == 1 || (b!=1 && 1==a)",
        e: "__1&&__2||__2"
      },
      {
        c: "a >= 1 || (b!=1 && 1<=a)",
        e: "__1&&__2||__2"
      },
      {
        c: "a != b && b != c",
        e: "__1&&__2"
      }
    ].forEach(function (test) {
      it(JSON.stringify(test.c), function () {
        var code = parseExpression(test.c);
        var condition = new Condition(code);
        code = condition.normalize();
        condition.getOperands(code);
        expect(condition.replaceOperands()).to.be.equal(test.e);
      });
    });
  });

});