var assert = require('assert');
var graphlib = require('graphlib');
var { calculateGridCells } = require('../css-grid');

describe('calculateGridCells', function() {
  const widgets = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  const right = new graphlib.Graph();
  const down = new graphlib.Graph();
  widgets.forEach((widget) => {
    right.setNode(widget);
    down.setNode(widget);
  });
  describe('columns', function() {
    const widths = {
      a: 500,
      b: 100,
      c: 200,
      d: 200,
      e: 300,
      f: 150,
      g: 350,
    };
    right.setEdge('b', 'c');
    right.setEdge('c', 'd');
    right.setEdge('e', 'd');
    right.setEdge('f', 'g');
    const { assignments, spans } = calculateGridCells(right, widths);

    it('should generate the correct assignments', function() {
      const correctColAssignments = {
        a: 1,
        b: 1,
        c: 2,
        d: 4,
        e: 1,
        f: 1,
        g: 3,
      };
      assert.deepEqual(assignments, correctColAssignments);
    });

    it('should generate the correct spans', function() {
      const correctColSpans = {
        a: 4,
        b: 1,
        c: 2,
        d: 1,
        e: 3,
        f: 2,
        g: 2,
      };
      assert.deepEqual(spans, correctColSpans);
    });

  });

  describe('rows', function() {
    const heights = {
      a: 75,
      b: 75,
      c: 75,
      d: 150,
      e: 75,
      f: 75,
      g: 75,
    };

    down.setEdge('a', 'b');
    down.setEdge('a', 'c');
    down.setEdge('a', 'd');
    down.setEdge('b', 'e');
    down.setEdge('c', 'e');
    down.setEdge('d', 'g');
    down.setEdge('e', 'f');
    down.setEdge('e', 'g');

    const { assignments, spans } = calculateGridCells(down, heights);

    it('should generate the correct assignments', function() {
      const correctRowAssignments = {
        a: 1,
        b: 2,
        c: 2,
        d: 2,
        e: 3,
        f: 4,
        g: 4,
      };
      assert.deepEqual(assignments, correctRowAssignments)
    });

    it('shoud generate the correct spans', function() {
      const correctRowSpans = {
        a: 1,
        b: 1,
        c: 1,
        d: 2,
        e: 1,
        f: 1,
        g: 1,
      };
      assert.deepEqual(spans, correctRowSpans);
    })
  });
});
