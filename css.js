const graphlib = require('graphlib');

const CSSBuilder = require('./utils/css-builder');
const { rangeMin, rangeMax } = require('./utils/range');

const precision = 3; // number of decimal places in CSS output

// given a DAG (instance of Graph from graphlib)
// return an object mapping node names to longest-path lengths from any source
function longestPathDAG(dag) {
  const pathLengths = {};
  const recursiveStep = (node) => {
    dag.successors(node).forEach((successor) => {
      pathLengths[successor] = Math.max(
        (pathLengths[successor] || 0),
        pathLengths[node] + 1
      );
      recursiveStep(successor);
    });
  };

  dag.sources().forEach((source) => {
    pathLengths[source] = 0;
    recursiveStep(source);
  });
  return pathLengths;
}

function cellAssignments(layout, widgets) {
  // assign child widgets to cells
  const colNumbers = longestPathDAG(layout.right);
  const rowNumbers = longestPathDAG(layout.down);
  // resolve cell conflicts by shifting down
  widgets.forEach((child1) => {
    widgets.forEach((child2) => {
      if (
        child1.localID !== child2.localID &&
        colNumbers[child1.localID] === colNumbers[child2.localID] &&
        rowNumbers[child1.localID] === rowNumbers[child2.localID]
      ) {
        graphlib.alg.preorder(layout.down, child2.localID).forEach((lID) => {
          rowNumbers[lID] += 1;
        });
      }
    });
  });
  return { colNumbers, rowNumbers };
}

// generates the non-responsive CSS for a page
function basePageCSS(page) {
  const css = new CSSBuilder();
  css.addRule('.erwd-children', 'display', 'grid');
  css.addRule('.erwd-children', 'grid-auto-columns', 'fit-content(100vw)');

  const recursiveStep = (widget) => {
    widget.children.forEach((child) => {
      css.addRule(`.${child.name}`, 'min-width', `${rangeMin(child.width)}px`);
      css.addRule(`.${child.name}`, 'max-width', `${rangeMax(child.width)}px`);
    });
  };
  recursiveStep(page);
  return css;
}

// TODO: this is the "whitespace hack" which should be eventually fixed
// we need to properly use column spanning to prevent unneeded whitespace
// for now, rescale breakpoints to actual width of displayed layout
function actualWidth(colNumbers, minimumWidth, widthAssignments) {
  const colWidths = new Array(Math.max(...Object.values(colNumbers)));
  Object.entries(colNumbers).forEach(([localID, c]) => {
    const width = widthAssignments[localID][0];
    const pxWidth = width > 1 ? width : width * minimumWidth;
    colWidths[c] = colWidths[c] ? Math.max(colWidths[c], pxWidth) : pxWidth;
  });
  return colWidths.reduce((a, b) => a + b, 0);
}

// rounds x to number of decimal places specified by precision
// there are some caveats with this, but it works for css output purposes
function round(x) {
  return parseFloat(x.toFixed(precision));
}

// generates the responsive CSS for a widget
// scale is used because breakpoints are based on parent size
//   but CSS currently only supports page size
//   scale <= 1 is a multiplier (parent width is scale * page width)
//   scale > 1 is an exact media query min-width value in pixels
// parentWidthBounds is a [minWidth, maxWidth] len-2 array
//   if scale > 1 then it should be that minWidth === maxWidth
//
function widgetCSS(
  widget,
  css = new CSSBuilder(),
  scale = 1,
  parentWidthBounds = [Number.NEGATIVE_INFINITY, Infinity]
) {
  // base case -- base widgets require no responsive css
  if (!widget.layouts) return;

  const layouts = widget.layouts.inRange(...parentWidthBounds).toArray();
  layouts.forEach(({ minValue: minWidL, data: layout, next: nextL }) => {
    const { colNumbers, rowNumbers } = cellAssignments(layout, widget.children);
    const maxWidL = nextL ? nextL.minValue : parentWidthBounds[1];

    // TODO: fix "whitespace hack"
    /* eslint-disable */
    const minWAssign = layout.widthAssignments.find(minWidL);
    if (minWAssign && minWidL) {
      minWidL = actualWidth(colNumbers, minWidL, minWAssign.data);
    }
    /* eslint-enable */

    // css for cell assignments
    const cssLayBP = css.mediaQuery(scale > 1 ? scale : minWidL / scale);
    widget.children.forEach((child) => {
      const selector = `#${child.globalID}`;
      cssLayBP.addRule(selector, 'grid-column', colNumbers[child.localID] + 1);
      cssLayBP.addRule(selector, 'grid-row', rowNumbers[child.localID] + 1);
    });

    // css for width assignments
    const widthAssignments = layout.widthAssignments
      .inRange(minWidL, maxWidL)
      .toArray();
    widthAssignments.forEach(({ minValue: minWidWA, data: wA, next }) => {
      // TODO: fix "whitespace hack"
      /* eslint-disable */
      const origMinW = minWidWA;
      minWidWA = actualWidth(colNumbers, minWidWA, wA);
      /* eslint-enable */

      const maxWidWA = next ? next.minValue : maxWidL;
      const cssWidthBP = css.mediaQuery(scale > 1 ? scale : minWidWA / scale);
      widget.children.forEach((child) => {
        // generate css to set width of child widget
        let width = wA[child.localID][0];
        const minusFixed = wA[child.localID][1];
        let widthCSS = '';
        if (width > 1 || scale > 1) {
          const pxWidth = width * (width > 1 ? 1 : parentWidthBounds[0]);
          widthCSS = `${round(pxWidth)}px`;
        } else {
          // TODO: fix "whitespace hack"
          width *= (origMinW / minWidWA);

          const scaledWidth = width * scale;
          const vwWidth = round(scaledWidth * 100);
          if (minusFixed === 0) {
            widthCSS = `${vwWidth}vw`;
          } else {
            const fracWidth = round(scaledWidth);
            const pxFixed = round(minusFixed);
            widthCSS = `calc(${vwWidth}vw - (${fracWidth} * ${pxFixed}px))`;
          }
        }
        cssWidthBP.addRule(`#${child.globalID}`, 'width', widthCSS);

        // calculate scale and bounds for child widget
        let newScale = scale;
        if (newScale <= 1) {
          newScale = width > 1 ? minWidWA / scale : scale * width;
        }
        let newBounds = [width, width];
        if (width <= 1) {
          // TODO: fix "whitespace hack"
          /* eslint-disable */
          minWidWA = origMinW;
          /* eslint-enable */
          newBounds = [width * minWidWA, width * maxWidWA];
        }

        // recurse
        widgetCSS(child, css, newScale, newBounds);
      });
    });
  });
}

function pageCSS(page) {
  const css = basePageCSS(page);
  widgetCSS(page, css);
  css.squish();
  return css;
}

module.exports = pageCSS;
