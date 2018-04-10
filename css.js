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

// TODO: this is the whitespace hack which should be eventually fixed
// we need to properly use column spanning to prevent unneeded whitespace
// for now, rescale breakpoints to actual width of displayed layout
const actualWidth = (colNumbers, minimumWidth, widthAssignments) => {
  const colWidths = new Array(Math.max(...Object.values(colNumbers)));
  Object.entries(colNumbers).forEach(([localID, c]) => {
    const width = widthAssignments[localID][0];
    const pxWidth = width > 1 ? width : width * minimumWidth;
    colWidths[c] = colWidths[c] ? Math.max(colWidths[c], pxWidth) : pxWidth;
  });
  return colWidths.reduce((a, b) => a + b, 0);
}

// generates the responsive CSS for a widget
// scale is used because breakpoints are based on parent size
//   but CSS currently only supports page size
function widgetCSS(widget, scale = 1, css = new CSSBuilder()) {
  if (!widget.layouts) return '';
  widget.layouts.forEach(({ minValue: layoutMinWidth, data: layout }) => {
    // assign child widgets to cells
    const colNumbers = longestPathDAG(layout.right);
    const rowNumbers = longestPathDAG(layout.down);
    // resolve cell conflicts by shifting down
    widget.children.forEach((child1) => {
      widget.children.forEach((child2) => {
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

    // TODO: fix whitespace hack
    const widthAssignments = layout.widthAssignments.find(layoutMinWidth);
    const hackScale1 = widthAssignments ? actualWidth(
      colNumbers,
      layoutMinWidth,
      widthAssignments.data
    ) / layoutMinWidth : 1;
    // css for cell assignments
    const cssLayBP = css.mediaQuery(layoutMinWidth * scale * hackScale1);
    widget.children.forEach((child) => {
      const selector = `#${child.globalID}`;
      cssLayBP.addRule(selector, 'grid-column', colNumbers[child.localID] + 1);
      cssLayBP.addRule(selector, 'grid-row', rowNumbers[child.localID] + 1);
    });

    // css for width assignments
    layout.widthAssignments.forEach(({ minValue: mw, data: wA }) => {
      // TODO: fix whitespace hack
      const hackScale2 = actualWidth(colNumbers, mw, wA) / mw;
      // actual css generation code
      const cssWidthBP = css.mediaQuery(mw * scale * hackScale2);
      widget.children.forEach((child) => {
        let [width, minusFixed] = wA[child.localID];
        let widthCSS = null;
        if (width > 1) {
          const pxWidth = parseFloat(width.toFixed(precision));
          widthCSS = `${pxWidth}px`;
        } else {
          width /= hackScale2;
          const vwWidth = parseFloat((width*100).toFixed(precision));
          if (minusFixed === 0) {
            widthCSS = `${vwWidth}vw`;
          } else {
            const fracWidth = parseFloat(width.toFixed(precision));
            const pxFixed = parseFloat((minusFixed).toFixed(precision));
            widthCSS = `calc(${vwWidth}vw - (${fracWidth} * ${pxFixed}px))`;
          }
        }
        cssWidthBP.addRule(`#${child.globalID}`, 'width', widthCSS);
        // recurse -- TODO: with proper scaling
        widgetCSS(child, scale / wA[child.localID][0], css);
      });
    });
  });
  return css;
}

function pageCSS(page) {
  const css = basePageCSS(page);
  return widgetCSS(page, 1, css);
}

module.exports = pageCSS;
