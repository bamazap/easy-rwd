// logs msg and then exits with the given code
function exit(msg, code = 0) {
  console.log(msg); // eslint-disable-line no-console
  process.exit(code);
}

// allows references like `foo.bar.baz` to be done without fear of error
// returns objct[flds[0]][flds[1]]...
// or dflt if a field access is attempted on null or undefined
function getOrDefault(objct, flds, dflt) {
  let broke = false;
  let obj = objct;
  flds.forEach((fld) => {
    if (obj !== null && obj !== undefined) {
      obj = obj[fld];
    } else {
      broke = true;
    }
  });
  return (broke ? dflt : obj);
}

// returns true if every element in the array is truthy, false otherwise
// optionally can pass in a function f to map array elements to true/false
function allTrue(arr, f) {
  return arr.reduce((prev, next) => prev && (f === undefined ? next : f(next)));
}

// like range function in python
// range(n) => [0, 1, ..., n-1]
// range(a, b) => [a, a+1, ..., b-1] ([] if a >= b)
// range(a, b, s) => [a, a+s, a+2*s, ..., a+n*s] (max n s.t. a+n*s < b)
function range(start, stop, step = 1) {
  const begin = stop === undefined ? 0 : start;
  const end = stop === undefined ? start : stop;
  const length = Math.max(Math.floor((end - begin) / step), 0);
  const output = new Array(length);
  for (let i = 0; i < length; i += 1) {
    output[i] = begin + (step * i);
  }
  return output;
}

// return a 1-level copy of obj
function copyObject(obj) {
  const copy = {};
  Object.keys(obj).forEach((key) => {
    copy[key] = obj[key];
  });
  return copy;
}

// checks if two objects have the same key-value pairs
// equality for keys and values uses ===
function objectsEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  return keys1.reduce((eq, key) => eq && obj1[key] === obj2[key]);
}

// returns a new object which is a copy of extendObj
//   and also has a view of oldObj
// all fields present in oldObj are aliased in newObj
// you cannot, however, add fields to oldObj if you only have newObj
function wrap(oldObj, extendObj) {
  const newObj = copyObject(extendObj);
  Object.keys(oldObj).filter(k => newObj[k] === undefined).forEach((k) => {
    Object.defineProperty(newObj, k, {
      get: () => oldObj[k],
      set: (v) => {
        oldObj[k] = v; // eslint-disable-line no-param-reassign
      },
      enumerable: true,
    });
  });
  return newObj;
}

// counts hashable inputs
class Counter {
  constructor() {
    this.counts = {};
  }

  count(key) {
    if (this.counts[key] === undefined) {
      this.counts[key] = 0;
    }
    this.counts[key] += 1;
    return this.counts[key];
  }

  reset() {
    this.counts = {};
  }
}

function forEachReverse(arr, f) {
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    f(arr[i]);
  }
}

function sum(arr) {
  return arr.reduce((accumulator, value) => accumulator + value);
}

function clip(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

module.exports = {
  exit,
  getOrDefault,
  allTrue,
  range,
  wrap,
  Counter,
  forEachReverse,
  sum,
  clip,
  objectsEqual,
};
