'use strict';

/**
 * @fileoverview Limit the number of top-level suites in a single file
 * @author Alexander Afanasyev
 */

const R = require('ramda');
const astUtil = require('../util/ast');
const { additionalSuiteNames } = require('../util/settings');

const defaultSuiteLimit = 1;

module.exports = function (context) {
    const stack = [];
    const topLevelDescribes = [];
    const options = context.options[0] || {};
    const settings = context.settings;
    let suiteLimit;

    if (R.isNil(options.limit)) {
        suiteLimit = defaultSuiteLimit;
    } else {
        suiteLimit = options.limit;
    }

    return {
        CallExpression(node) {
            if (astUtil.isDescribe(node, additionalSuiteNames(settings))) {
                stack.push(node);
            }
        },

        'CallExpression:exit'(node) {
            if (astUtil.isDescribe(node, additionalSuiteNames(settings))) {
                if (stack.length === 1) {
                    topLevelDescribes.push(node);
                }

                stack.pop(node);
            }
        },

        'Program:exit'() {
            if (topLevelDescribes.length > suiteLimit) {
                context.report({
                    node: topLevelDescribes[suiteLimit],
                    message: `The number of top-level suites is more than ${ suiteLimit }.`
                });
            }
        }
    };
};
