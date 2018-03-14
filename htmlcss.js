const graphlib = require('graphlib');

function baseHTML(id, className, innerHTML) {
  return `<div id="${id}" class="erwd-widget ${className}">
    ${innerHTML}
  </div>\n`;
}

function generatedHTML(id, className, innerHTML) {
  return `<div id="${id}" class="erwd-widget ${className}">
    <div class="erwd-children">
      ${innerHTML}
    </div>
  </div>\n`;
}

// concatenates the html of the widget's children and returns it
// or returns the value of the html field for a base widget
function buildWidgetHTML(widget) {
  if (widget.html !== undefined) {
    return baseHTML(widget.globalID, widget.name, widget.html);
  }
  const innerHTML = widget.children
    .map(child => buildWidgetHTML(child))
    .reduce((a, b) => a + b);
  return generatedHTML(widget.globalID, widget.name, innerHTML);
}

// builds and returns HTML for a page (a page is just a widget object)
function pageHTML(page, appName, head) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${appName} | ${page.name}</title>
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" href="${page.name}.css?v=1.0">
        ${head}
      </head>
      <body style="margin:0;">
        ${buildWidgetHTML(page)}
      </body>
    </html>`;
}

const baseCSS = `.erwd-children {
  display: grid;
}`;

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

function widgetCSS(widget, scale) {
  if (!widget.layouts) return '';
  let css = '';
  widget.layouts.forEach(([minWidth, layout]) => {
    css += `@media only screen and (min-width: ${minWidth * scale}px) {\n`;
    // assign child widgets to cells
    const colNumbers = longestPathDAG(layout.right);
    const rowNumbers = longestPathDAG(layout.down);
    // resolve cell conflicts by shifting down
    widget.children.forEach((child1) => {
      widget.children.forEach((child2) => {
        if (child1.localID === child2.localID) return;
        if (
          colNumbers[child1.localID] === colNumbers[child2.localID] &&
          rowNumbers[child1.localID] === rowNumbers[child2.localID]
        ) {
          graphlib.alg.preorder(layout.down, child2.localID).forEach((lID) => {
            rowNumbers[lID] += 1;
          });
        }
      });
    });
    // css for direct children
    widget.children.forEach((child) => {
      css += `#${child.globalID} {
        grid-column: ${colNumbers[child.localID] + 1};
        grid-row: ${rowNumbers[child.localID] + 1};
      }\n`;
    });
    css += '}\n';
    // recurse -- css for grandchildren, etc
    widget.children.forEach((child) => {
      css += widgetCSS(child, 1); // TODO: figure out how to calculate scale
    });
  });
  return css;
}

function pageCSS(page) {
  return baseCSS + widgetCSS(page, 1);
}

module.exports = {
  buildWidgetHTML,
  pageHTML,
  pageCSS,
};
