'use strict';

const _ = require('lodash');
const P = require('bluebird');
const errors = require('../errors');
const queries = require('./remediations.queries');
const format = require('./remediations.format');
const resolutions = require('../resolutions');
const inventory = require('../connectors/inventory');
const issues = require('../issues');
const identifiers = require('../util/identifiers');

const notFound = res => res.status(404).json();

// TODO: optimize overlapping issue IDs
// TODO: side-effects are ugly
function resolveResolutions (...remediations) {
    return P.all(_(remediations).flatMap('issues').map(async issue => {
        issue.resolution = await resolutions.resolveResolution(issue.issue_id, issue.resolution);
    }).value());
}

exports.list = errors.async(async function (req, res) {
    const remediations = await queries.list(req.identity.account_number, req.identity.id).map(r => r.toJSON());

    await resolveResolutions(...remediations);

    remediations.forEach(remediation => {
        remediation.needs_reboot = _.some(remediation.issues, 'resolution.needsReboot');
        remediation.system_count = _(remediation.issues).flatMap('systems').uniqBy('id').size();
        remediation.issue_count = remediation.issues.length;
    });

    // TODO: resolve owner information

    res.json(format.list(remediations));
});

async function resolveSystems (remediation) {
    const systems = _.flatMap(remediation.issues, 'systems');
    const ids = _(systems).map('id').uniq().value();

    const systemDetails = await inventory.getSystemDetailsBatch(ids);

    _.forEach(systems, system => {
        const {hostname, display_name} = systemDetails[system.id];
        system.hostname = hostname;
        system.display_name = display_name;
    });
}

function resolveIssues (remediation) {
    return P.all(remediation.issues.map(async issue => {
        const id = identifiers.parse(issue.issue_id);
        issue.details = await issues.getIssueDetails(id);
    }));
}

exports.get = errors.async(async function (req, res) {
    let remediation = await queries.get(req.swagger.params.id.value, req.identity.account_number, req.identity.id);

    if (!remediation) {
        return notFound(res);
    }

    remediation = remediation.toJSON();

    await P.all([
        resolveSystems(remediation),
        resolveResolutions(remediation),
        resolveIssues(remediation)
    ]);

    res.json(format.get(remediation));
});
