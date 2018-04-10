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


function round(number, precision) {
  const shift = function (number, precision, reverseShift) {
    if (reverseShift) {
      precision = -precision;
    }  
    numArray = ("" + number).split("e");
    return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
  };
  return shift(Math.round(shift(number, precision, false)), precision, true);
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
