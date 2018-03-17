// WIDTH ALGORITHMS
// return a breakpoints
// data are dictionaries mapping each widget's localID to a width assignment
//   values <= 1 are fractional widths
//   values > 1  are discrete max widths

const leftFirst = require('./width-algorithms/left-first');
const flexDAG = require('./width-algorithms/flex-dag');

module.exports = {
  leftFirst,
  flexDAG,
};
