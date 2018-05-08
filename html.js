const oneIndent = '  ';

// TODO: Remove extra indentation on first line of each child widget.
function indentHTML(html, numIndents = 1) {
  const indent = oneIndent.repeat(numIndents);
  return `${indent}${html.replace(/(?:\r\n|\r|\n)/g, `\n${indent}`)}`;
}

function baseHTML(id, className, innerHTML) {
  return indentHTML(`<div id="${id}" class="erwd-widget ${className}">
${indentHTML(innerHTML)}
</div>\n`);
}

function generatedHTML(id, className, innerHTML) {
  return indentHTML(`<div id="${id}" class="erwd-widget ${className}">
  <div class="erwd-children">
${indentHTML(innerHTML.replace(/\s*$/, ''), 1)}
  </div>
</div>\n`);
}

// concatenates the html of the widget's children and returns it
// or returns the value of the html field for a base widget
function buildWidgetHTML(widget) {
  const className = widget.localID ? `${widget.name} ${widget.localID}` : widget.name;
  if (widget.html !== undefined) {
    return baseHTML(widget.globalID, className, widget.html);
  }
  const innerHTML = widget.children
    .map(child => buildWidgetHTML(child, 1))
    .reduce((a, b) => `${a}\n${b}`);
  return generatedHTML(widget.globalID, className, innerHTML);
}

// builds and returns HTML for a page (a page is just a widget object)
function pageHTML(page, appName, head) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${appName} | ${page.name}</title>
    <meta name="viewport"
      content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="${page.name}.css?v=1.0">
    ${head}
  </head>
  <body style="margin:0;">
${indentHTML(buildWidgetHTML(page), 1).slice(0, -oneIndent.length)}</body>
</html>`.replace(/(?:\r\n|\r|\n)\s*(?:\r\n|\r|\n)/g, '\n\n');
}

module.exports = pageHTML;
