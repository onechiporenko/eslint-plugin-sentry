"use strict";

class ASTProcessor {

  constructor(node, allowedTypes) {
    this.checkNodeType(node, allowedTypes);
  }

  checkNodeType(node, allowedTypes) {
    const _allowedTypes = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    if (_allowedTypes.indexOf(node.type) === -1) {
      throw new Error(`"node" should be one of ${_allowedTypes.join(", ")}`);
    }
  }

}

module.exports = ASTProcessor;