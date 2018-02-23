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

module.exports = {
  exit,
  getOrDefault,
  allTrue,
};
