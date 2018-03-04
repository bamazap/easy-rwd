// returns a string representing a div tag
function divHTML(id, className, innerHTML) {
  return `<div id="${id}" class="${className}">${innerHTML}</div>`;
}

// concatenates the html of the widget's children and returns it
// or returns the value of the html field for a base widget
function buildWidgetHTML(widget) {
  if (widget.html !== undefined) {
    return widget.html;
  }
  let widgetHTML = '';
  widget.children.forEach((child) => {
    const childHTML = buildWidgetHTML(child);
    widgetHTML += divHTML(child.id, child.name, childHTML);
  });
  return widgetHTML;
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
        ${page.html}
      </body>
    </html>`;
}

function pageCSS(page) {
  return page ? '' : ''; // TODO: implement
}

module.exports = {
  buildWidgetHTML,
  pageHTML,
  pageCSS,
};
