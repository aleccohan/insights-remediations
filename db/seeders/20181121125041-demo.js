'use strict';

const _ = require('lodash');

const account_number = 'demo';
const created_by = 'demoUser';

const opts = {
    returning: true
};

const systems = [
    '8dadd8d7-5f1d-49c3-a560-af3cada7ce83',
    'fc84c991-a029-4882-bc9c-7e351a73b59f',
    '58b2837a-5df5-4466-9033-c4b46248d4b4',
    '29dafba0-c190-4acd-998d-074ba0aee477',
    '784ba855-922c-4dbf-bb93-d2e5d9e54a81',
    '4f02195c-a3e4-4dcf-aeca-65db4ca25632',
    '5afdc03f-4560-4ca9-a373-9724401df154',
    '8fa9e16e-eed5-4597-8072-b102b7c35f11',
    '9da41b6e-f77e-430a-9022-4ac1ffab288a'
];

exports.up = async q => {
    const remediations = await q.bulkInsert('remediations', [{
        id: '9939e04a-a936-482d-a317-008c058f7918',
        name: 'Patch vulnerabilities on production systems',
        account_number,
        created_by,
        created_at: '2018-11-21T10:19:38.541Z',
        updated_by: created_by,
        updated_at: '2018-11-21T10:19:38.541Z'
    }, {
        id: '0bcebc81-0d53-4f77-b0f0-1a56e01a55fd',
        name: 'Recommended configuration changes',
        account_number,
        created_by,
        created_at: '2018-11-21T09:19:38.541Z',
        updated_by: created_by,
        updated_at: '2018-11-21T09:19:38.541Z'
    }, {
        id: '42503118-80d4-49e0-bfee-20ac2d8ea74f',
        name: 'Mixed remediation',
        account_number,
        created_by,
        created_at: '2018-11-21T11:19:38.541Z',
        updated_by: created_by,
        updated_at: '2018-11-21T11:19:38.541Z'
    }], opts);

    const issues = await q.bulkInsert('remediation_issues', [{
        remediation_id: remediations[0].id,
        issue_id: 'vulnerabilities:CVE_2017_6074_kernel|KERNEL_CVE_2017_6074'
    }, {
        remediation_id: remediations[0].id,
        issue_id: 'vulnerabilities:CVE-2017-17713'
    }, {
        remediation_id: remediations[0].id,
        issue_id: 'vulnerabilities:RHSA-2018:0502'
    }, {
        remediation_id: remediations[1].id,
        issue_id: 'advisor:network_bond_opts_config_issue|NETWORK_BONDING_OPTS_DOUBLE_QUOTES_ISSUE'
    }, {
        remediation_id: remediations[1].id,
        issue_id: 'compliance:xccdf_org.ssgproject.content_rule_sshd_disable_root_login'
    }], opts);

    issues.forEach(issue => {
        const systemSlice = (issue.remediation_id === remediations[0].id) ? systems.slice(0, 2) : systems.slice(2, 4);

        q.bulkInsert('remediation_issue_systems', systemSlice.map(system => ({
            remediation_issue_id: issue.id,
            system_id: system
        })));
    });

    const mixedIssues = await q.bulkInsert('remediation_issues', [{
        remediation_id: remediations[2].id,
        issue_id: 'advisor:network_bond_opts_config_issue|NETWORK_BONDING_OPTS_DOUBLE_QUOTES_ISSUE'
    }, {
        remediation_id: remediations[2].id,
        issue_id: 'vulnerabilities:CVE_2017_6074_kernel|KERNEL_CVE_2017_6074'
    }, {
        remediation_id: remediations[2].id,
        issue_id: 'compliance:xccdf_org.ssgproject.content_rule_sshd_disable_root_login'
    }], opts);

    await q.bulkInsert('remediation_issue_systems', _.flatMap(mixedIssues, (issue, i) => {
        const index = i * 3;
        return systems.slice(index, index + 3).map(system => ({
            remediation_issue_id: issue.id,
            system_id: system
        }));
    }));
};
