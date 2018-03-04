const find = require('find');
const fs = require('fs-extra');

const utils = require('./utils');

// reads and processes JSON file to create widgets object
function readWidgets(file) {
  const widgets = JSON.parse(fs.readFileSync(file, 'utf8'));
  Object.keys(widgets).forEach((widgetName) => {
    if (widgetName === 'head') {
      utils.exit('Widget called "head" uses reserved name', 1);
    }
    // give each widget a name field
    widgets[widgetName].name = widgetName;
    // shorthand: set row field to false if unspecified
    if (widgets[widgetName].row === undefined) {
      widgets[widgetName].row = false;
    }
    // shorthand: handle special row syntax
    widgets[widgetName].children.forEach((child, i) => {
      if (Array.isArray(child)) {
        const rowName = `${widgetName}-row-${i}`;
        widgets[rowName] = {
          name: rowName,
          children: child,
          row: true,
        };
        widgets[widgetName].children[i] = rowName;
      }
    });
  });
  return widgets;
}

// parses a size comment into an object
// size comments look like <!-- width: [[100, 150],[200, 200]], height: 100 -->
function parseSizeComment(sizeComment) {
  const sizeJSON = sizeComment.replace('<!--', '{').replace('-->', '}');
  const sizeObj = JSON.parse(sizeJSON);

  // helper function to check if all elements of an array are numbers
  const allNumbers = arr => utils.allTrue(arr, x => typeof x === 'number');
  // helper function to fail if size comment isn't correctly formatted
  const failBadSizeComment = () => {
    utils.exit(`Badly formatted size comment: ${sizeComment}`, 1);
  };

  // width should be an array of arrays of numbers
  if (typeof sizeObj.width === 'number') {
    // shorthand: allow a single number for constant width
    sizeObj.width = [[sizeObj.width, sizeObj.width]];
  } else if (sizeObj.width.length === 2 && allNumbers(sizeObj.width)) {
    // shorthand: allow a single array of numbers for continuous width range
    sizeObj.width = [sizeObj.width];
  } else if (!utils.allTrue(sizeObj.width, allNumbers)) {
    failBadSizeComment();
  }

  // height should be a number
  // TODO: eventually support non-constant height for base widgets
  if (typeof sizeObj.height !== 'number') {
    failBadSizeComment();
  }
  const { height } = sizeObj;
  // create a height function
  sizeObj.height = _w => height;

  return sizeObj;
}

// reads html files to create widget objects, returns an array of them
function readHTML() {
  const newWidgets = [];
  // get sizes and contents of the base widgets
  // TODO: figure out whose job it is to enforce sizes
  find.fileSync(/\.htm[l]?$/, `${'.'}/src`).forEach((file) => {
    let name = file.substr(file.lastIndexOf('/') + 1);
    name = name.substr(0, name.lastIndexOf('.'));
    const fileContent = fs.readFileSync(file, 'utf8');
    // first line of file is special size comment
    const sizeComment = fileContent.substr(0, fileContent.indexOf('\n'));
    const html = fileContent.substr(fileContent.indexOf('\n'));
    const sizeObj = parseSizeComment(sizeComment);
    const widget = {
      width: sizeObj.width,
      height: sizeObj.height,
      html,
      children: [],
      name,
      row: false,
    };
    newWidgets.push(widget);
  });
  return newWidgets;
}

function readIn(file) {
  // get generated widgets from JSON file
  const widgets = readWidgets(file);
  // get base widgets from HTML files
  readHTML(widgets).forEach((widget) => {
    widgets[widget.name] = widget;
  });
  // replace string names in child arrays with references to widget objects
  Object.keys(widgets).forEach((widgetName) => {
    widgets[widgetName].children.forEach((childName, i) => {
      widgets[widgetName].children[i] = widgets[childName];
    });
  });
  return widgets;
}

function readCSS() {
  let css = '';
  find.fileSync(/\.css$/, `${'.'}/src`).forEach((file) => {
    css += fs.readFileSync(file, 'utf8');
  });
  return css;
}

function readHead() {
  const files = find.fileSync(/\/head.html$/, `${'.'}/src`);
  return files.length === 1 ? fs.readFileSync(files[0], 'utf8') : '';
}

function writeOut(pageName, html, css) {
  fs.emptyDirSync('./build');
  fs.writeFileSync(`./build/${pageName}.html`, html);
  fs.writeFileSync(`./build/${pageName}.css`, css);
}

module.exports = {
  readIn,
  writeOut,
  readCSS,
  readHead,
};

