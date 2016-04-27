// http://stackoverflow.com/questions/29784879/lib-d-ts-arrray-prototype-find
//noinspection TsLint
interface Array<T> {
  /**
   * Returns the value of the first element in the array where predicate is true, and undefined
   * otherwise.
   * @param predicate find calls predicate once for each element of the array, in ascending
   * order, until it finds one where predicate returns true. If such an element is found, find
   * immediately returns that element value. Otherwise, find returns undefined.
   * @param thisArg If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  find(predicate: (value: T, index: number, obj: Array<T>) => boolean, thisArg?: any): T;

  /**
   * Returns the index of the first element in the array where predicate is true, and undefined
   * otherwise.
   * @param predicate find calls predicate once for each element of the array, in ascending
   * order, until it finds one where predicate returns true. If such an element is found, find
   * immediately returns that element value. Otherwise, find returns undefined.
   * @param thisArg If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  findIndex(predicate: (value: T) => boolean, thisArg?: any): number;
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
// ES6 definition
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    //noinspection TsLint
    if (this === null || this === undefined) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    let list = Object(this);
    let length = list.length >>> 0;
    let thisArg = arguments[1];
    let value;

    for (let i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    //noinspection TsLint
    if (this === null || this === undefined) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    let list = Object(this);
    let length = list.length >>> 0;
    let thisArg = arguments[1];
    let value;

    for (let i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}
