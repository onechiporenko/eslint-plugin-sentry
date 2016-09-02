"use strict";

const keys = Object.keys;

function objectsAreEqual(obj1, obj2) {
  let keys1 = keys(obj1);
  let keys2 = keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let i = 0; i < keys1.length; i++) {
    if (obj1[keys1[i]] !== obj2[keys1[i]]) {
      return false;
    }
  }
  return true;
}

function getBinaryCombos(vars, ignoredValues) {
  let _ignoredValues = [];
  if (Array.isArray(ignoredValues)) {
    _ignoredValues = ignoredValues;
  }
  else {
    if (ignoredValues) {
      _ignoredValues = [ignoredValues];
    }
  }
  let _vars = [];
  let n = vars.length;
  for (let i = 0; i < n; i++) {
    if (_ignoredValues.indexOf(vars[i]) === -1) {
      _vars.push(vars[i]);
    }
  }
  n = _vars.length;
  let result = [];
  const allCombos = Math.pow(2, n);
  for (let y = 0; y < allCombos; y++) {
    let combo = {};
    for (let x = 0; x < n; x++) {
      combo[_vars[x]] = !!(y >> x & 1);
    }
    result.push(combo);
  }
  return result;
}

module.exports = {
  objectsAreEqual: objectsAreEqual,
  getBinaryCombos: getBinaryCombos
};