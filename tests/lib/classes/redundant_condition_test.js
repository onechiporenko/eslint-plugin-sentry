"use strict";

const RedundantCondition = require("../../../lib/classes/redundant_condition.js");
const expect = require("chai").expect;
const sinon = require("sinon");
const vars = require("../../../lib/utils/vars.js");
const escodegen = require("escodegen");

const helper = require("../../helper.js");

describe("#RedundantCondition", function () {

  beforeEach(function () {
    sinon.stub(RedundantCondition.prototype, "checkNodeType", () => true)
  });

  afterEach(function () {
    RedundantCondition.prototype.checkNodeType.restore();
  });

  describe("#constructor", function () {
    it("should set `conditionNode`", function () {
      const code = helper.parseExpression("a === 1 && b === 2");
      const condition = new RedundantCondition(code);
      expect(condition.conditionNode).to.be.eql(code);
    });
  });

  describe("#normalize", function () {

    it("original condition node is not changed", function () {
      const code = helper.parseExpression("a === b");
      const condition = new RedundantCondition(code);
      condition.generateNormalizedNode();
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
        const code = helper.parseExpression(test.c);
        const condition = new RedundantCondition(code);
        condition.generateNormalizedNode();
        const normalizedConditionNode = condition.normalizedNodes;
        expect(escodegen.generate(normalizedConditionNode, vars.codeGenOptions)).to.be.equal(test.e);
      });
    });

  });

  describe("#generateOperands", function () {
    [
      {
        c: "!a",
        e: {
          "!a": "__0__0"
        }
      },
      {
        c: "a.b == 1",
        e: {
          "a.b==1": "__0__0"
        }
      },
      {
        c: "a.b() == 1",
        e: {
          "a.b()==1": "__0__0"
        }
      },
      {
        c: "a == 1",
        e: {
          "a==1": "__0__0"
        }
      },
      {
        c: "a == 1 && b==1",
        e: {
          "a==1": "__0__1",
          "b==1": "__0__0"
        }
      },
      {
        c: "a == 1 || b==1 || 1==a",
        e: {
          "a==1": "__0__1",
          "b==1": "__0__0"
        }
      },
      {
        c: "(a == 1 || b==1) && 1==a",
        e: {
          "a==1": "__0__1",
          "b==1": "__0__0"
        }
      },
      {
        c: "a == 1 || (b!=1 && 1==a)",
        e: {
          "a==1": "__0__1",
          "b!=1": "__0__0"
        }
      },
      {
        c: "a >= 1 || (b!=1 && 1<=a)",
        e: {
          "a>=1": "__0__1",
          "b!=1": "__0__0"
        }
      },
      {
        c: "a != b && b != c",
        e: {
          "b!=a": "__0__1",
          "c!=b": "__0__0"
        }
      },
      {
        c: "a && a.b",
        e: {
          "a.b": "__0__0",
          "a": "__0__1"
        }
      }
    ].forEach(function (test) {
      it(JSON.stringify(test.c), function () {
        let code = helper.parseExpression(test.c);
        const condition = new RedundantCondition(code);
        condition.generateNormalizedNode();
        code = condition.normalizedNodes;
        condition.generateOperands(code);
        expect(condition.operands).to.be.eql(test.e);
      });
    });
  });

  describe("#_simplifyOperands", function () {
    [
      {
        c: "!a",
        e: "__0__0"
      },
      {
        c: "a.b == 1",
        e: "__0__0"
      },
      {
        c: "a.b() == 1",
        e: "__0__0"
      },
      {
        c: "a == 1 && b==1",
        e: "__0__0&&__0__1"
      },
      {
        c: "a == 1 || b==1 || 1==a",
        e: "__0__0||__0__1||__0__1"
      },
      {
        c: "(a == 1 || b==1) && 1==a",
        e: "(__0__0||__0__1)&&__0__1"
      },
      {
        c: "a == 1 || (b!=1 && 1==a)",
        e: "__0__0&&__0__1||__0__1"
      },
      {
        c: "a >= 1 || (b!=1 && 1<=a)",
        e: "__0__0&&__0__1||__0__1"
      },
      {
        c: "a != b && b != c",
        e: "__0__0&&__0__1"
      },
      {
        c: "a && a.b()",
        e: "__0__0&&__0__1"
      },
      {
        c: "a.b() && a",
        e: "__0__0&&__0__1"
      },
      {
        c: "a[b==c?'b':'c'] == 1 && b",
        e: "__0__0&&__0__1"
      }
    ].forEach(function (test) {
      it(JSON.stringify(test.c), function () {
        const code = helper.parseExpression(test.c);
        const condition = new RedundantCondition(code);
        condition.generateNormalizedNode();
        condition.generateOperands(condition.normalizedNodes);
        expect(condition._simplifyOperands()).to.be.equal(test.e);
      });
    });
  });

  describe("#generateTruthTable", function () {

    [
      {c: "a", e: {}},
      {
        c: "a && b", e: {
        __0__0: {
          "false": {
            "false": false,
            "true": false
          },
          "true": {
            "false": false,
            "true": true
          }
        },
        __0__1: {
          "false": {
            "false": false,
            "true": false
          },
          "true": {
            "false": false,
            "true": true
          }
        }
      }
      },
      {
        c: "a && b || a", e: {
        __0__0: {
          "false": {
            "true": true,
            "false": false
          },
          "true": {
            "true": true,
            "false": false
          }
        },
        __0__1: {
          "false": {
            "true": false,
            "false": false
          },
          "true": {
            "true": true,
            "false": true
          }
        }
      }
      },
      {
        c: "a && b && c || a", e: {
        __0__0: {
          true: {
            "false,false": false,
            "true,false": false,
            "false,true": true,
            "true,true": true
          },
          false: {
            "false,false": false,
            "true,false": false,
            "false,true": true,
            "true,true": true
          }
        },
        __0__1: {
          true: {
            "false,false": false,
            "true,false": false,
            "false,true": true,
            "true,true": true
          },
          false: {
            "false,false": false,
            "true,false": false,
            "false,true": true,
            "true,true": true
          }
        },
        __0__2: {
          true: {
            "false,false": true,
            "true,false": true,
            "false,true": true,
            "true,true": true
          },
          false: {
            "false,false": false,
            "true,false": false,
            "false,true": false,
            "true,true": false
          }
        }
      }
      }
    ].forEach(function (test) {
      it(JSON.stringify(test.c), function () {
        const code = helper.parseExpression(test.c);
        const condition = new RedundantCondition(code);
        condition.generateNormalizedNode();
        condition.generateOperands(condition.normalizedNodes);
        condition.generateTruthTable();
        expect(condition.truthTable).to.be.eql(test.e);
      });
    });

  });

  describe("#checkTruthTableForRedundantConditions", function () {

    [
      {c: "a", e: []},
      {c: "a && b", e: []},
      {c: "a && b || a", e: ["b"]},
      {c: "a && b && c || a", e: ["c", "b"]},
      {c: "a && b && c && d || a", e: ["d", "c", "b"]},
      {c: "a && b && c || a && b", e: ["c"]},
      {c: "a && b && c && d || a && b", e: ["d", "c"]},
      {c: "a && b && (c || d) || a && b", e: ["d", "c"]},
      {c: "a && (b || c || d) || a", e: ["d", "c", "b"]}
    ].forEach(function (test) {
      it(test.c, function () {
        const code = helper.parseExpression(test.c);
        const condition = new RedundantCondition(code);
        expect(condition.parse()).to.be.eql(test.e);
      });
    });

  });

});