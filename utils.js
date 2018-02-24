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
  if (stop === undefined) {
    stop = start; // eslint-disable-line no-param-reassign
    start = 0; // eslint-disable-line no-param-reassign
  }
  const length = Math.max(Math.floor((stop - start) / step), 0);
  const output = new Array(length);
  for (let i = 0; i < length; i += 1) {
    output[i] = start + (step * i);
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

// returns a new object which is a copy of extendObj
//   and also has a view of oldObj
function wrap(oldObj, extendObj) {
  const newObj = copyObject(extendObj);
  Object.keys(oldObj).filter(k => newObj[k] === undefined).forEach((k) => {
    Object.defineProperty(newObj, k, {
      get: () => oldObj[k],
      set: (v) => {
        oldObj[k] = v; // eslint-disable-line no-param-reassign
      },
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

module.exports = {
  exit,
  getOrDefault,
  allTrue,
  range,
  wrap,
  Counter,
};
