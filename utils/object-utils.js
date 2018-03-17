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

// return a 1-level copy of obj
function copyObject(obj) {
  const copy = {};
  Object.keys(obj).forEach((key) => {
    copy[key] = obj[key];
  });
  return copy;
}

// checks if two objects have the same key-value pairs
//   eqFn is used to compare values (default is ===)
function objectsEqual(obj1, obj2, eqFn = (a, b) => a === b) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  return keys1.reduce((eq, key) => eq && eqFn(obj1[key], obj2[key]));
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

module.exports = {
  getOrDefault,
  copyObject,
  objectsEqual,
  wrap,
};
