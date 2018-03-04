const utils = require('./utils');

// a range is an array of segments
//   where segment i (Si) and segment i+1 (Sj) satisfy Si[1] < Sj[0]
// a segment is a length-2 array of numbers [a, b] where a <= b

// returns true if the segments overlap and false otherwise
function segmentsOverlap(segment1, segment2) {
  return (
    (
      segment1[0] <= segment2[0] &&
      segment1[1] >= segment2[0]
    ) || (
      segment2[0] <= segment1[0] &&
      segment2[1] >= segment1[0]
    )
  );
}

// returns the union of two overlapping segments
// behavior is unspecified if the two segments do not overlap
function unionSegments(segment1, segment2) {
  return [
    Math.min(segment1[0], segment2[0]),
    Math.max(segment1[1], segment2[2]),
  ];
}

// returns a new range containing only values in the original range
//   that are at least min and no more than max
function clipRange(range, min, max) {
  return range
    .filter(segment => segment[1] >= min && segment[0] <= max)
    .map(segment => [Math.max(segment[0], min), Math.min(segment[1], max)]);
}

// returns a new range which contains all values c in range 1 or range 2
function unionRanges(range1, range2) {
  let i = 0;
  let j = 0;
  const union = [];
  while (i < range1.length && j < range2.length) {
    if (segmentsOverlap(range1[i], range2[j])) {
      let overlap = unionSegments(range1[i], range2[j]);
      i += 1;
      j += 1;
      while (i < range1.length && segmentsOverlap(overlap, range1[i])) {
        overlap = unionSegments(overlap, range1[i]);
        i += 1;
      }
      while (j < range2.length && segmentsOverlap(overlap, range2[j])) {
        overlap = unionSegments(overlap, range2[j]);
        j += 1;
      }
      union.push(overlap);
    } else if (range1[i][0] <= range2[i][0]) {
      union.push(range1[i].slice(0));
      i += 1;
    } else {
      union.push(range2[j].slice(0));
      j += 1;
    }
  }
  while (i < range1.length) {
    union.push(range1[i].slice(0));
    i += 1;
  }
  while (j < range2.length) {
    union.push(range2[j].slice(0));
    j += 1;
  }
  return union;
}

// returns a new range which contains all possible values of
//   max(a, b)  where a in range 1 and b in range 2
function maxRanges(range1, range2) {
  return unionRanges(
    clipRange(range1, range2[0][0], Infinity),
    clipRange(range2, range1[0][0], Infinity)
  );
}

// returns a new range which contains all possible values of
//   min(a, b)  where a in range 1 and b in range 2
function minRanges(range1, range2) {
  return unionRanges(
    clipRange(range1, Number.NEGATIVE_INFINITY, range2[1][1]),
    clipRange(range2, Number.NEGATIVE_INFINITY, range1[1][1])
  );
}

// returns a new range which contains all possible values of
//   a + b where a in range 1 and b in range 2
function addRanges(range1, range2) {
  const segments = [];
  // consider all possible segment combinations
  range1.forEach((segment1) => {
    range2.forEach((segment2) => {
      segments.push([segment1[0] + segment2[0], segment1[1] + segment2[1]]);
    });
  });
  // join segments that overlap using the classic algorithm
  segments.sort(segment => segment[0]);
  const newRange = [];
  let joinedSegment = segments[0].slice(0);
  segments.slice(1).forEach((segment) => {
    if (joinedSegment[1] >= segment[0]) {
      joinedSegment[1] = Math.max(joinedSegment[1], segment[1]);
    } else {
      newRange.push(joinedSegment);
      joinedSegment = segment.slice(0);
    }
  });
  newRange.push(joinedSegment);
  return newRange;
}

function rangeForEach(range, f) {
  range.forEach(([a, b]) => {
    utils.range(a, b).forEach(f);
  });
}

// returns the smallest value in the range
function rangeMin(range) {
  return range[0][0];
}

// returns the largest value in the range
function rangeMax(range) {
  return range[range.length - 1][1];
}

// returns true if i is in range false otherwise
function rangeIn(range, i) {
  return range.reduce((isIn, [a, b]) => isIn || (i >= a && i <= b), false);
}

// returns the largest value in range that is <= i
// if i is smaller than the smallest value s in range, return s
function rangeFloor(range, i) {
  let ans = null;
  utils.forEachReverse(range, ([a, b]) => {
    if (i > b) {
      ans = b;
    } else if (i >= a && i <= b) {
      ans = i;
    }
  });
  if (ans === null) {
    ans = rangeMin(range);
  }
  return ans;
}

// returns the smallest value in range that is >= i
// if i is larger than the largest value l in range, return l
function rangeCeil(range, i) {
  let ans = null;
  range.forEach(([a, b]) => {
    if (i < a) {
      ans = a;
    } else if (i >= a && i <= b) {
      ans = i;
    }
  });
  if (ans === null) {
    ans = rangeMax(range);
  }
  return ans;
}


module.exports = {
  addRanges,
  unionRanges,
  maxRanges,
  minRanges,
  clipRange,
  rangeForEach,
  rangeIn,
  rangeFloor,
  rangeCeil,
};
