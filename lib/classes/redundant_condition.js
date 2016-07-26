"use strict";

var Condition = require("./condition.js");
var misc = require("../utils/misc.js");

const keys = Object.keys;

class RedundantCondition extends Condition {

  parse() {
    super.parse();
    return this.checkTruthTableForRedundantConditions();
  }

  checkTruthTableForRedundantConditions() {
    let truthTable = this.truthTable;
    if (!Object.keys(truthTable).length) {
      return [];
    }
    let args = keys(this.invertedOperands);
    return args.filter(arg => {
      let byKey = truthTable[arg];
      return misc.objectsAreEqual(byKey["true"], byKey["false"]);
    }).map(arg=>this.invertedOperands[arg]);
  }

}

module.exports = RedundantCondition;