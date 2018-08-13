'use strict';

const ResolutionPlay = require('../ResolutionPlay');
const TEMPLATES = require('../../resolutions').test;

exports.application = 'test';

exports.createPlay = function ({id, hosts}) {
    if (TEMPLATES[id.issue]) {
        return new ResolutionPlay(id, hosts, TEMPLATES[id.issue]);
    }
};
