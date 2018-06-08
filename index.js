// import config data
require('./config');

// third party modules
const async = require('async');
const moira = require('moira');
const hover = require('hover-api')(config.user, config.pass);

if(process.argv[2] == undefined || process.argv[3] == undefined) {
    console.error('Usage: node index parentdomain.com subdomain');
} else {
    async.autoInject({
        getIp: function(callback) {
            moira.getIP(function(err, ip, service) {
                if(err) {
                    return callback(err)
                }
                console.log(`Setting A record for ${process.argv[3]}.${process.argv[2]} to ${ip}`);
                callback(null, ip);
            });
        },
        getDns: function(domain, callback) {
            hover.getDomainDns(domain, callback);
        },
        domain: function(callback) {
            callback(null, process.argv[2]);
        },
        existingDnsRecordId: function(getDns, callback) {
            var entry = getDns[0].entries.filter(function(entry) {
                return entry.name === process.argv[3];
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
            hover.createARecord(domain, process.argv[3], getIp, callback);
        }
    }, function(err, results) {
        if(err) {
            console.error('ERROR', err);
        } else {
            console.log('DNS update completed');
        }
    });
}
