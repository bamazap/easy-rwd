const graphlib = require('graphlib');

const CSSBuilder = require('./utils/css-builder');
const { rangeMin, rangeMax } = require('./utils/range');

function mediaQuery(minWidth) {
  return `@media only screen and (min-width: ${minWidth}px)`;
}

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
    // css for cell assignments
    const cssLayBP = css.nestedStatement(mediaQuery(layoutMinWidth * scale));
    widget.children.forEach((child) => {
      const selector = `#${child.globalID}`;
      cssLayBP.addRule(selector, 'grid-column', colNumbers[child.localID] + 1);
      cssLayBP.addRule(selector, 'grid-row', rowNumbers[child.localID] + 1);
    });
    // css for width assignments
    layout.widthAssignments.forEach(({ minValue: mw, data: w }) => {
      const cssWidthBP = css.nestedStatement(mediaQuery(mw * scale));
      widget.children.forEach((child) => {
        let width = w[child.localID];
        let unit = 'px';
        if (width <= 1) {
          unit = 'vw';
          width = width * scale * 100;
        }
        cssWidthBP.addRule(`#${child.globalID}`, 'width', `${width}${unit}`);
        // recurse -- TODO: with proper scaling
        widgetCSS(child, scale / w[child.localID], css);
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
