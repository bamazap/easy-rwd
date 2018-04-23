const { objectsEqual } = require('../utils/object-utils');
const range = require('../utils/range');
const Breakpoints = require('../utils/breakpoints');

// returns Breakpoints (singleton)
function sourceToSinkPaths(dag) {
  const recursiveStep = (node) => {
    const successors = dag.successors(node);
    if (successors.length === 0) return [[node]];
    return successors.map(suc =>
      [].concat(...recursiveStep(suc).map(leg => [node].concat(leg))));
  };
  return [].concat(...dag.sources().map(recursiveStep));
}

function add(a, b) {
  return a + b;
}

function approxEqual(a, b, maxDiff = 0.00001) {
  return Math.abs(a - b) < maxDiff;
}

function fracsEqual(f1, f2) {
  return objectsEqual(f1, f2, ([a, x], [b, y]) =>
    approxEqual(a, b) && approxEqual(x, y));
}
const maxIter = 10000;

// dag is a instance of Graph from graphlib
//   it should be directed and acyclic
// widgets is an object mapping widget names to widget objects
// parentWidthRange is a Range representing the width of the container
// grows (optional) is a dictionary mapping widget nanes to numbers
//   which represent the relative rates at which widgets should expand
//   if not given, we assume all widgets should expand at the same rate
function flexDAG(dag, widgets, parentWidthRange, userGrows = {}) {
  const widgetNames = dag.nodes();
  const legs = sourceToSinkPaths(dag);
  const grows = userGrows;

  // default grow value is 1
  widgetNames.forEach((widgetName) => {
    if (grows[widgetName] === undefined) {
      grows[widgetName] = 1;
    }
  });


  // arguments
  // prevFracs: Fracs -- used as starting place
  // parentWidth: Number -- horizontal space (px) available
  // iter: number -- depth of recursion, will not pass maxIter
  // returns
  // newFracs: Fracs -- new percent widths for widgets
  const expand = (prevFracs, parentWidth, iter = 0) => {
    if (iter >= maxIter) return prevFracs;
    const newFracs = {};
    legs.forEach((leg) => {
      // don't expand widgets with fixed pixel widths
      const fixedWidgets = leg.filter(n => prevFracs[n][0] > 1);
      fixedWidgets.forEach((widgetName) => {
        newFracs[widgetName] = prevFracs[widgetName];
      });
      // expand widgets with fractional widths < 1
      const growWidgets = leg.filter(n => prevFracs[n][0] <= 1);
      growWidgets.forEach((widgetName) => {
        newFracs[widgetName] = [1, 0];
      });
      const fixedSpace = fixedWidgets.map(n => prevFracs[n][0]).reduce(add, 0);
      const legGrowTotal = growWidgets.map(n => grows[n]).reduce(add, 0);
      growWidgets.forEach((widgetName) => {
        // grow by shrinking from 100%
        // if a widget is in two legs, this avoids overallocating
        // fixed space is tracked to aid CSS ouput
        newFracs[widgetName] = [
          Math.min(
            grows[widgetName] / legGrowTotal,
            newFracs[widgetName][0]
          ),
          Math.max(fixedSpace, newFracs[widgetName][1]),
        ];
        // clip widgets to fixed sizes if they exceed their width range
        const pxWidth = newFracs[widgetName][0] * (parentWidth - fixedSpace);
        // round to be robust to floating point arithmetic
        if (!range.rangeIn(widgets[widgetName].width, Math.round(pxWidth))) {
          newFracs[widgetName] = [
            range.rangeFloor(widgets[widgetName].width, pxWidth),
            0,
          ];
        }
      });
    });
    if (fracsEqual(prevFracs, newFracs)) {
      return newFracs;
    }
    return expand(newFracs, parentWidth, iter + 1);
  };

  // calculate minimum possible percent widths based on minimums of width ranges
  // we assume any valid layout can at least fit all children at min width
  const minFracs = {};
  const maxParentWidth = range.rangeMax(parentWidthRange);
  dag.nodes().forEach((widgetName) => {
    const minChildWidth = range.rangeMin(widgets[widgetName].width);
    minFracs[widgetName] = [minChildWidth / maxParentWidth, 0];
  });

  // a breakpoint is needed for edge/discontinuity in width range
  const breakpoints = new Breakpoints();
  let lastFracs = null;
  range.rangeForEach(parentWidthRange, (parentWidth) => {
    const newFracs = expand(minFracs, parentWidth);
    if (lastFracs === null || !fracsEqual(lastFracs, newFracs)) {
      breakpoints.add(parentWidth, newFracs);
      lastFracs = newFracs;
    }
  });

  return breakpoints;
}

module.exports = flexDAG;
