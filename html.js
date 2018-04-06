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
    ${buildWidgetHTML(page)}
  </body>
</html>`;
}

module.exports = pageHTML;
