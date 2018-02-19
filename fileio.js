var find = require('find');
var fs = require('fs-extra');
var utils = require('./utils')

// reads and processes JSON file to create widgets object
var readWidgets = function(file) {
  var widgets = JSON.parse(fs.readFileSync(file, 'utf8'));
  Object.keys(widgets).forEach(function(name) {
    if (name === 'head') {
      utils.exit('Widget called "head" uses reserved name', 1);
    }
    var widget = widgets[name];
    // shorthand: set row field to false if unspecified
    widget['row'] = utils.getOrDefault(widget, ['row'], false);
    // shorthand: handle special row syntax
    widget['children'].forEach(function(child, i) {
      if (Array.isArray(child)) {
        var rowName = `${name}-row-${i}`;
        widgets[rowName] = {
          name: rowName,
          children: child,
          row: true,
        };
        widget['children'][i] = rowName;
      }
    });
  });
  return widgets;
}

// parses a size comment into an object
// size comments look like <!-- width: [[100, 150],[200, 200]], height: 100 -->
var parseSizeComment = function(sizeComment) {
  var sizeJSON = sizeComment.replace('<!--', '{').replace('-->', '}');
  var sizeObj = JSON.parse(sizeJSON);
  // width should be an array of arrays of numbers
  var width = sizeObj['width'];
  var allNumbers = function(arr) {
    return utils.allTrue(arr, function(x) {
      return typeof x === 'number';
    });
  }
  if (typeof width === 'number') {
    // shorthand: allow a single number
    width = [[width, width]];
  } else if (width.length == 2 && allNumbers(width)) {
    // shorthand: allow a single array of numbers
    width = [width];
  } else if (!utils.allTrue(width, allNumbers)) {
    // fail if size comment is badly formatted
    utils.exit(`Badly formatted size comment: ${sizeComment}`, 1);
  }
  sizeObj['width'] = width;
  return sizeObj;
}

// reads html files to create widget objects
var readHTML = function(widgets) {
  // get sizes and contents of the base widgets
  // TODO: figure out whose job it is to enforce sizes
  find.fileSync(/\.htm[l]?$/, `${'.'}/src`).forEach(function(file) {
    var name = file.substr(file.lastIndexOf('/')+1);
    name = name.substr(0, name.lastIndexOf('.'));
    if (widgets[name]) {
      utils.exit('HTML provided for widget in JSON file.', 1);
    }
    var fileContent = fs.readFileSync(file, 'utf8');
    // first line of file is special size comment
    var sizeComment = fileContent.substr(0, fileContent.indexOf('\n'));
    var html = fileContent.substr(fileContent.indexOf('\n'));
    var sizeObj = parseSizeComment(sizeComment);
    var widget = {
      width: sizeObj['width'],
      height: sizeObj['height'],
      html: html,
      children: [],
      name: name,
      row: false,
    };
    widgets[name] = widget;
  });
}

var readIn = function(file) {
  var widgets = readWidgets(file);
  readHTML(widgets);
  return widgets;
}

var readCSS = function() {
  var css = '';
  find.fileSync(/\.css$/, `${'.'}/src`).forEach(function(file) {
    css += fs.readFileSync(file, 'utf8');
  });
  return css;
}

var readHead = function() {
  var head = '';
  var files = find.fileSync(/\/head.html$/, `${'.'}/src`);
  if (files.length === 1) {
    head += fs.readFileSync(files[0], 'utf8');
  }
  return head;
}

var writeOut = function(pageName, html, css) {
  fs.emptyDirSync('./build');
  fs.writeFileSync(`./build/${pageName}.html`, html);
  fs.writeFileSync(`./build/${pageName}.css`, css);
}

var fileio = {
  readIn: readIn,
  writeOut: writeOut,
  readCSS: readCSS,
  readHead: readHead,
}

module.exports = fileio;
