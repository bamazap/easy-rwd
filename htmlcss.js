// returns a string representing a div tag
var divHTML = function(id, className, innerHTML) {
  return `<div id="${id}" class="${className}">${innerHTML}</div>`;
}

// concatenates the html of the widget's children and returns it
// or returns the value of the html field for a base widget
var buildWidgetHTML = function(widget) {
  if (widget['html'] !== undefined) {
    return widget['html'];
  }
  var widgetHTML = '';
  widget['children'].forEach(function(child) {
    var childHTML = buildWidgetHTML(child);
    widgetHTML += divHTML(child['id'], child['name'], childHTML);
  })
  return widgetHTML;
}

// builds and returns HTML for a page (a page is just a widget object)
var buildPageHTML = function(page, app_name, head) {
  page['html'] = buildWidgetHTML(page);
  return page_template = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${app_name} | ${page['name']}</title>
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" href="${page['name']}.css?v=1.0">
        ${head}
      </head>
      <body style="margin:0;">
        ${page['html']}
      </body>
    </html>`;
}

module.exports = {
  buildPageHTML: buildPageHTML,
}
