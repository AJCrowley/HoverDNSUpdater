// import config data
require('./config');

// third party modules
const async = require('async');
const moira = require('moira');
const hover = require('hover-api')(config.user, config.pass);

async.autoInject({
    getIp: function(callback) {
        moira.getIP(function(err, ip, service) {
            if(err) {
                return callback(err)
            }
            console.log(`Current IP: ${ip}`);
            callback(null, ip);
        });
    },
    getDns: function(domain, callback) {
        hover.getDomainDns(domain, callback);
    },
    domain: function(callback) {
        callback(null, config.domain);
    },
    existingDnsRecordId: function(getDns, callback) {
        var entry = getDns[0].entries.filter(function(entry) {
            return entry.name === config.subdomain;
        })[0];
        callback(null, typeof(entry) === 'object' ? entry.id : null);
    },
    removeDnsRecord: function(existingDnsRecordId, callback) {
        if(!existingDnsRecordId) {
            return callback(null);
        }
        hover.removeDns(existingDnsRecordId, callback);
    },
    createDnsRecord: function(removeDnsRecord, domain, getIp, callback) {
        hover.createARecord(domain, config.subdomain, getIp, callback);
    }
}, function(err, results) {
    if(err) {
        console.error('ERROR', err);
    } else {
        console.log('DNS update completed');
    }
});