// sums all elements in the inputted array (uses +)
function sum(arr) {
  return arr.reduce((accumulator, value) => accumulator + value);
}

// returns true if every element in the array is truthy, false otherwise
// optionally can pass in a function f to map array elements to true/false
function allTrue(arr, f) {
  return arr.reduce((prev, next) => prev && (f === undefined ? next : f(next)));
}

// like range function in python
// range(n) => [0, 1, ..., n-1]
// range(a, b) => [a, a+1, ..., b-1] ([] if a >= b)
// range(a, b, s) => [a, a+s, a+2*s, ..., a+n*s] (max n s.t. a+n*s < b)
function range(start, stop, step = 1) {
  const begin = stop === undefined ? 0 : start;
  const end = stop === undefined ? start : stop;
  const length = Math.max(Math.ceil((end - begin) / step), 0);
  const output = new Array(length);
  for (let i = 0; i < length; i += 1) {
    output[i] = begin + (step * i);
  }
  return output;
}

// does a forEach in reverse order
function forEachReverse(arr, f) {
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    f(arr[i]);
  }
}

function allIndexesOf(arr, val) {
  const indexes = [];
  for (let i = 0; i < arr.length; i += 1) {
    if (arr[i] === val) {
      indexes.push(i);
    }
  }
  return indexes;
}

// all pairings between two arrays
// if second array is not given it does all non-duplicate pairings in the one
//   [a, b] and [b, a] are distinct pairings
function product(arr1, arr2 = undefined) {
  const output = [];
  arr1.forEach((elm1, i) => {
    if (arr2) {
      arr2.forEach((elm2) => {
        output.push([elm1, elm2]);
      });
    } else {
      arr1.forEach((elm2, j) => {
        if (i !== j) {
          output.push([elm1, elm2]);
        }
      });
    }
  });
  return output;
}

// credit: Alex Reinking
// https://codereview.stackexchange.com/questions/139095/generate-powerset-in-js
function powerSet(l) {
  return (function ps(list) {
    if (list.length === 0) {
      return [[]];
    }
    const head = list.pop();
    const tailPS = ps(list);
    return tailPS.concat(tailPS.map(e => [head].concat(e)));
  }(l.slice()));
}

module.exports = {
  sum,
  allTrue,
  range,
  forEachReverse,
  allIndexesOf,
  product,
  powerSet,
};
