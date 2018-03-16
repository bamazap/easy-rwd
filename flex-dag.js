const utils = require('./utils');
const range = require('./range');

// returns string[][]
function sourceToSinkPaths(dag) {
  const recursiveStep = (node) => {
    const successors = dag.successors(node);
    if (successors.length === 0) return [[node]];
    return successors.map(suc =>
      [].concat(...recursiveStep(suc).map(leg => [node].concat(leg))));
  };
  return [].concat(...dag.sources().map(recursiveStep));
}

function approxEqual(a, b, maxDiff = 0.0001) {
  return Math.abs(a - b) < maxDiff;
}

function fracsEqual(f1, f2) {
  return utils.objectsEqual(f1, f2, approxEqual);
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

  // precalculate sums of grow values for each leg
  const legGrowTotals = legs.map(l => utils.sum(l.map(w => grows[w])));

  // arguments
  // prevFracs: Fracs -- used as starting place
  // limitFn: (widgetName: string, widgetFrac: number) => number
  //   used to keep widget widths in their valid range
  // iter: number -- depth of recursion, will not pass maxIter
  // returns
  // newFracs: Fracs -- new percent widths for widgets
  const expand = (prevFracs, limitFn, iter = 0) => {
    if (iter >= maxIter) return prevFracs;
    const newFracs = {};
    widgetNames.forEach((widgetName) => {
      newFracs[widgetName] = 1;
    });
    legs.forEach((leg, i) => {
      const fracLeft = 1 - utils.sum(leg.map((w) => {
        if (prevFracs[w] > 1) return 0;
        return prevFracs[w];
      }));
      leg.forEach((widgetName) => {
        if (prevFracs[widgetName] > 1) {
          newFracs[widgetName] = prevFracs[widgetName];
          return;
        }
        const growRatio = grows[widgetName] / legGrowTotals[i];
        newFracs[widgetName] = Math.min(
          prevFracs[widgetName] + (fracLeft * growRatio),
          newFracs[widgetName]
        );
        newFracs[widgetName] = limitFn(widgetName, newFracs[widgetName]);
      });
    });
    if (fracsEqual(prevFracs, newFracs)) {
      return newFracs;
    }
    return expand(newFracs, limitFn, iter + 1);
  };

  // calculate minimum possible percent widths based on minimums of width ranges
  // we assume any valid layout can at least fit all children at min width
  const minFracs = {};
  const minParentWidth = range.rangeMin(parentWidthRange);
  dag.nodes().forEach((widgetName) => {
    const minChildWidth = range.rangeMin(widgets[widgetName].width);
    minFracs[widgetName] = minChildWidth / minParentWidth;
  });

  // quickly get an estimte of percent widths, ignoring width ranges
  let fracs = expand(minFracs, (_, widgetFrac) => widgetFrac);
  let lastFracs = null;

  // a breakpoint is needed for edge/discontinuity in width range
  const breakpoints = [];
  range.rangeForEach(parentWidthRange, (parentWidth) => {
    // percent width limits depend on width of parent
    const limitFn = (widgetName, widgetFrac) => {
      const width = widgetFrac * parentWidth;
      if (range.rangeIn(widgets[widgetName].width, width)) return widgetFrac;
      return range.rangeFloor(widgets[widgetName].width, width);
    };
    fracs = expand(minFracs, limitFn);
    if (lastFracs === null || !fracsEqual(lastFracs, fracs)) {
      breakpoints.push([parentWidth, fracs]);
      lastFracs = fracs;
    }
  });

  return breakpoints;
}

module.exports = {
  flexDAG,
};
