"use strict";

const Condition = require("./condition.js");
const misc = require("../utils/misc.js");

const keys = Object.keys;

class RedundantCondition extends Condition {

  constructor(conditionNode) {
    super(conditionNode);
    this.truthTable = {};
  }

  parse() {
    super.parse();
    this.generateTruthTable();
    return this.checkTruthTableForRedundantConditions();
  }

  /**
   *
   * @returns {object}
   */
  generateTruthTable() {
    let args = keys(this.invertedOperands);
    if (args.length === 1) {
      return [];
    }
    let simplifiedBody = this._simplifyOperands();
    let simplifiedFunction = this._getSimplifiedFunction(args, simplifiedBody);
    let argNames = args.sort();
    let ret = {};
    argNames.forEach(function (argName, indx) {
      const argNames2 = argNames.filter(_argName => _argName !== argName);
      if(!ret.hasOwnProperty(argName)) {
        ret[argName] = {};
      }
      const combos = misc.getBinaryCombos(argNames2);
      [true, false].forEach(function (v) {
        const strV = "" + v;
        if (!ret[argName].hasOwnProperty(strV)) {
          ret[argName][strV] = {};
        }
        combos.forEach(function (combo) {
          let args = argNames2.map(_argName => combo[_argName]);
          const _args = args.slice();
          args.splice(indx, 0, v);
          const value = simplifiedFunction.apply(null, args);
          const key = _args.join();
          ret[argName][strV][key] = value;
        });
      });
    });
    this.truthTable = ret;
  }

  checkTruthTableForRedundantConditions() {
    let truthTable = this.truthTable;
    if (!Object.keys(truthTable).length) {
      return [];
    }
    let args = keys(this.invertedOperands);
    return args
      .filter(arg => misc.objectsAreEqual(truthTable[arg]["true"], truthTable[arg]["false"]))
      .map(arg => this.invertedOperands[arg]);
  }

}

module.exports = RedundantCondition;