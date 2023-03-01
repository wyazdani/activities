'use strict';

const _ = require('lodash');
const {ObjectId} = require('mongoose').Types;

/**
 * This helper contains useful functions to do custom comparisons not possible using other compare libs
 *
 * @author Michael Barnard <michael.barnard@a24group.com>
 * @since  19 Jan 2022
 *
 * @module ComparatorHelper
 */
module.exports = {

  /**
   * This is a custom isEmpty check. When dealing with mongoose ids, it does a toString before checking empty.
   * This is done because _.isEmpty on ObjectId returns true even if the id is set. Doing a toString() first fixes this.
   *
   * If not dealing with an ObjectId, it just calls _.isEmpty
   *
   * @param {*} value - The value you wish to do the empty check on
   */
  isEmpty: function isEmpty(value) {
    if (value instanceof ObjectId) {
      return _.isEmpty(value.toString());
    }
    return _.isEmpty(value);
  }
};
