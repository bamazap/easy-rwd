#!/usr/bin/env node
const fileio = require('./fileio');
const widgetUtils = require('./widgets');
const htmlcss = require('./htmlcss');

function build(file) {
  const widgets = fileio.readIn(file);
  const userStyles = fileio.readCSS();
  const head = fileio.readHead();

  const appName = file.substr(0, file.lastIndexOf('.'));

  widgetUtils.getPages(widgets).forEach((page) => {
    widgets[page.name].html = htmlcss.buildWidgetHTML(page);
    const html = htmlcss.pageHTML(page, appName, head);
    const css = userStyles; // TODO
    fileio.writeOut(page.name, html, css);
  });
}

module.exports = build;
