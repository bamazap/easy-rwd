class CSSBuilder {
  constructor(indent = '  ') {
    this.indent = indent;
    this.rules = {};
    this.nestedStatements = {};
    // TODO: support other at-rules
  }

  addRule(selector, property, value) {
    if (!({}).hasOwnProperty.call(this.rules, selector)) {
      this.rules[selector] = {};
    }
    this.rules[selector][property] = value;
  }

  nestedStatement(condition) {
    if (!({}).hasOwnProperty.call(this.nestedStatements, condition)) {
      this.nestedStatements[condition] = new CSSBuilder();
    }
    return this.nestedStatements[condition];
  }

  toString(numIndents = 0) {
    const baseIndent = this.indent.repeat(numIndents);
    const rulesCSS = Object.entries(this.rules).map(([sel, decl]) => {
      const declCSS = Object.entries(decl).map(([prop, val]) =>
        `${baseIndent + this.indent}${prop}: ${val};`).join('\n');
      return `${baseIndent}${sel} {\n${declCSS}\n${baseIndent}}`;
    }).join('\n\n');
    const nsCSS = Object.entries(this.nestedStatements).map(([cond, cssB]) => {
      const nestedCSS = cssB.toString(numIndents + 1);
      return `${baseIndent}${cond} {\n${nestedCSS}${baseIndent}}`;
    }).join('\n\n');
    return `${rulesCSS}\n${nsCSS ? '\n' : ''}${nsCSS}`;
  }
}

module.exports = CSSBuilder;
