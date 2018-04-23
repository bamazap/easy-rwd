const {
  getOrDefault,
  objectsEqual,
  copyObject,
  wrap,
} = require('./object-utils');

const {
  range,
  allTrue,
  sum,
  forEachReverse,
} = require('./array-utils');

// logs msg and then exits with the given code
function exit(msg, code = 0) {
  console.log(msg); // eslint-disable-line no-console
  process.exit(code);
}


module.exports = {
  exit,
  range,
  allTrue,
  sum,
  forEachReverse,
  getOrDefault,
  wrap,
  objectsEqual,
  copyObject,
};
