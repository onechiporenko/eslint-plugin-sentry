"use strict";

class ASTProcessor {

  constructor(node) {
    this.checkNodeType(node);
  }

  checkNodeType(node) {
    let _allowedTypes = this.getAllowedTypes();
    _allowedTypes = Array.isArray(_allowedTypes) ? _allowedTypes : [_allowedTypes];
    if (_allowedTypes.indexOf(node.type) === -1) {
      throw new Error(`"node" should be one of ${_allowedTypes.join(", ")}`);
    }
  }

  getAllowedTypes() {
    throw new Error("`getAllowedTypes` shuold be overridden");
  }

  parse() {
    throw new Error("`parse` should be overridden");
  }

}

module.exports = ASTProcessor;