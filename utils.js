// logs msg and then exits with the given code
var exit = function(msg, code=0) {
  console.log(msg);
  process.exit(code);
} 

// allows references like `foo.bar.baz` to be done without fear of error
// returns objct[flds[0]][flds[1]]...
// or dflt if a field access is attempted on null or undefined
var getOrDefault = function(objct, flds, dflt) {
  var broke = false;
  var obj = objct;
  flds.forEach(function(fld) {
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
var allTrue = function(arr, f) {
  return arr.reduce(function(prev, next) {
    return prev && (f === undefined ? next : f(next));
  }, true);
}

var utils = {
  exit: exit,
  getOrDefault: getOrDefault,
  allTrue: allTrue,
}

module.exports = utils;
