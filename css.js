const CSSBuilder = require('./utils/css-builder');
const { rangeMin, rangeMax } = require('./utils/range');
const { range } = require('./utils/array-utils');
const { objectsEqual } = require('./utils/object-utils');
const { calculateGridCells } = require('./css-grid');
const Breakpoints = require('./utils/breakpoints');

const precision = 3; // number of decimal places in CSS output
const maxScreenWidth = 1920;

// generates the non-responsive CSS for a page
function basePageCSS(page) {
  const css = new CSSBuilder();
  css.addRule('.erwd-children', 'display', 'grid');
  css.addRule('.erwd-children', 'grid-auto-columns', 'min-content');

  const recursiveStep = (widget) => {
    widget.children.forEach((child) => {
      css.addRule(`.${child.name}`, 'min-width', `${rangeMin(child.width)}px`);
      css.addRule(`.${child.name}`, 'max-width', `${rangeMax(child.width)}px`);
      recursiveStep(child);
    });
  };
  recursiveStep(page);
  return css;
}

// rounds x to number of decimal places specified by precision
// there are some caveats with this, but it works for css output purposes
function round(x) {
  return parseFloat(x.toFixed(precision));
}

function calculatePXWidth(widthAssignment, parentWidth) {
  const [width, fixed] = widthAssignment;
  return width > 1 ? width : (parentWidth - fixed) * width;
}

function calculatePXWidths(widthAssignments, parentWidth) {
  const pxWidthAssignments = {};
  Object.entries(widthAssignments).forEach(([localID, widthAssign]) => {
    pxWidthAssignments[localID] = calculatePXWidth(widthAssign, parentWidth);
  });
  return pxWidthAssignments;
}

function calculatePXHeights(widgets, pxWidths) {
  const pxHeightAssignments = {};
  widgets.forEach((widget) => {
    const pxHeight = widget.height(pxWidths[widget.localID]);
    pxHeightAssignments[widget.localID] = pxHeight;
  });
  return pxHeightAssignments;
}

function getCells(widgets, layout, widths, parentWidth) {
  const pxWidths = calculatePXWidths(widths, parentWidth);
  const pxHeights = calculatePXHeights(widgets, pxWidths);
  const {
    assignments: colAssignments,
    spans: colSpans,
  } = calculateGridCells(layout.right, pxWidths);
  const {
    assignments: rowAssignments,
    spans: rowSpans,
  } = calculateGridCells(layout.down, pxHeights);
  return {
    colAssignments,
    colSpans,
    rowAssignments,
    rowSpans,
  };
}

function cmpCells(a, b) {
  return (
    objectsEqual(a.colAssignments, b.colAssignments) &&
    objectsEqual(a.colSpans, b.colSpans) &&
    objectsEqual(a.rowAssignments, b.rowAssignments) &&
    objectsEqual(a.rowSpans, b.rowSpans)
  );
}

function widthCSS(widthAssignment, scale, parentFixed) {
  const [width, fixed] = widthAssignment;
  if (width > 1) {
    return `${round(width)}px`;
  }
  if (scale > 1) {
    return `${round(width * (scale - parentFixed))}px`;
  }
  const wid = round(width * scale);
  const fix = round(fixed + parentFixed);
  if (fix === 0) {
    return `${wid * 100}vw`;
  }
  if (wid === 1) {
    return `calc(${wid * 100}vw - ${fix}px)`;
  }
  return `calc(${wid * 100}vw - (${wid} * ${fix}px))`;
}

function colCSS(id, cells) {
  const start = cells.colAssignments[id];
  const end = start + cells.colSpans[id];
  return `${start} / ${end}`;
}

function rowCSS(id, cells) {
  const start = cells.rowAssignments[id];
  const end = start + cells.rowSpans[id];
  return `${start} / ${end}`;
}

function addCSS(css, widgets, minWid, widths, cells, scale, parentFixed) {
  const minScreenWidth = scale > 1 ? scale : (minWid / scale) + parentFixed;
  const cssMQ = css.mediaQuery(minScreenWidth);
  widgets.map(widget => widget.localID).forEach((localID) => {
    const id = `#${localID}`;
    cssMQ.addRule(id, 'width', widthCSS(widths[localID], scale, parentFixed));
    cssMQ.addRule(id, 'grid-column', colCSS(localID, cells));
    cssMQ.addRule(id, 'grid-row', rowCSS(localID, cells));
  });
}

function widgetCSS(
  widget,
  css = new CSSBuilder(),
  scale = 1,
  parentFixed = 0,
  parentWidthBounds = [Number.NEGATIVE_INFINITY, Infinity]
) {
  // base case -- base widgets require no responsive css
  if (!widget.layouts) return;
  widget.layouts.inRange(...parentWidthBounds)
    .toArray()
    .forEach(({ minValue: minWidL, data: layout, next: nextL }) => {
      const maxWidL = nextL ? nextL.minValue : parentWidthBounds[1];
      layout.widthAssignments.inRange(minWidL, maxWidL)
        .toArray()
        .forEach(({ minValue: minWidW, data: widths, next: nextW }) => {
          const maxWidW = nextW ? nextW.minValue : maxWidL;
          const domain = range(minWidW, Math.min(maxWidW, maxScreenWidth));
          const cellF = pW => getCells(widget.children, layout, widths, pW);
          Breakpoints.fromFunction(domain, cellF, cmpCells)
            .toArray()
            .forEach(({ minValue: minWidC, data: cells, next: nextC }) => {
              const maxWidC = nextC ? nextC.minValue : maxWidW;
              const { children } = widget;
              addCSS(css, children, minWidC, widths, cells, scale, parentFixed);
              children.forEach((child) => {
                const [width, fixed] = widths[child.localID];
                let newScale = scale;
                if (newScale <= 1) {
                  if (width > 1) {
                    newScale = (minWidC / scale) + parentFixed;
                  } else {
                    newScale = scale * width;
                  }
                }
                const newBounds = [
                  (width > 1 ? width : width * (minWidC - fixed)),
                  (width > 1 ? width : width * (maxWidC - fixed)),
                ];
                widgetCSS(child, css, newScale, fixed, newBounds);
              });
            });
        });
    });
}


// generates the responsive CSS for a widget
// scale is used because breakpoints are based on parent size
//   but CSS currently only supports page size
//   scale <= 1 is a multiplier (parent width is scale * page width)
//   scale > 1 is an exact media query min-width value in pixels
// parentWidthBounds is a [minWidth, maxWidth] len-2 array
//   if scale > 1 then it should be that minWidth === maxWidth
//
// function widgetCSS(
//   widget,
//   css = new CSSBuilder(),
//   scale = [1, 0],
//   parentWidthBounds = [Number.NEGATIVE_INFINITY, Infinity]
// ) {
//   // base case -- base widgets require no responsive css
//   if (!widget.layouts) return;

//   const layouts = widget.layouts.inRange(...parentWidthBounds).toArray();
//   layouts.forEach(({ minValue: minWidL, data: layout, next: nextL }) => {
//     const { colNumbers, rowNumbers } = cellAssignments(layout, widget.children);
//     const maxWidL = nextL ? nextL.minValue : parentWidthBounds[1];

//     // TODO: fix "whitespace hack"
//     /* eslint-disable */
//     const minWAssign = layout.widthAssignments.find(minWidL);
//     if (minWAssign && minWidL) {
//       minWidL = actualWidth(colNumbers, minWidL, minWAssign.data);
//     }
//     /* eslint-enable */

//     // css for cell assignments
//     const pxLayBP = scale[0] > 1 ? scale[0] : (minWidL / scale[0]) + scale[1];
//     const cssLayBP = css.mediaQuery(pxLayBP);
//     widget.children.forEach((child) => {
//       const selector = `#${child.globalID}`;
//       cssLayBP.addRule(selector, 'grid-column', colNumbers[child.localID] + 1);
//       cssLayBP.addRule(selector, 'grid-row', rowNumbers[child.localID] + 1);
//     });

//     // css for width assignments
//     const widthAssignments = layout.widthAssignments
//       .inRange(minWidL, maxWidL)
//       .toArray();

//     widthAssignments.forEach(({ minValue: minWidWA, data: wA, next }) => {
//       // TODO: fix "whitespace hack"
//       /* eslint-disable */
//       const origMinW = minWidWA;
//       minWidWA = actualWidth(colNumbers, minWidWA, wA);
//       /* eslint-enable */

//       const maxWidWA = next ? next.minValue : maxWidL;
//       const pxWaBP = scale[0] > 1 ? scale[0] : (minWidWA / scale[0]) + scale[1];
//       const cssWidthBP = css.mediaQuery(pxWaBP);
//       widget.children.forEach((child) => {
//         // generate css to set width of child widget
//         let width = wA[child.localID][0];
//         const minusFixed = wA[child.localID][1];
//         let widthCSS = '';
//         if (width > 1) {
//           widthCSS = `${round(width)}px`;
//         } else if (scale[0] > 1) {
//           const pxWidth = width * (parentWidthBounds[0] - minusFixed);
//           widthCSS = `${round(pxWidth)}px`;
//         } else {
//           // TODO: fix "whitespace hack"
//           width *= (origMinW / minWidWA);
//           const scaledWidth = width * scale[0];
//           const vwWidth = round(scaledWidth * 100);
//           if (minusFixed === 0 && scale[1] === 0) {
//             widthCSS = `${vwWidth}vw`;
//           } else {
//             const fracWidth = round(scaledWidth);
//             const pxFixed = round(minusFixed + scale[1]);
//             widthCSS = `calc(${vwWidth}vw - (${fracWidth} * ${pxFixed}px))`;
//           }
//         }
//         cssWidthBP.addRule(`#${child.globalID}`, 'width', widthCSS);

//         // calculate scale
//         const newScale = [scale[0], minusFixed];
//         if (newScale[0] <= 1) {
//           if (width > 1) {
//             newScale[0] = (minWidWA / scale[0]) + scale[1];
//           } else {
//             newScale[0] = scale[0] * width;
//           }
//         }

//         // calculate bounds
//         let newBounds = [width, width];
//         if (width <= 1) {
//           // TODO: fix "whitespace hack"
//           /* eslint-disable */
//           minWidWA = origMinW;
//           /* eslint-enable */
//           newBounds = [
//             width * (minWidWA - minusFixed),
//             width * (maxWidWA - minusFixed),
//           ];
//         }

//         // recurse
//         widgetCSS(child, css, newScale, newBounds);
//       });
//     });
//   });
// }

function pageCSS(page) {
  const css = basePageCSS(page);
  widgetCSS(page, css);
  css.squish();
  return css;
}

module.exports = pageCSS;
