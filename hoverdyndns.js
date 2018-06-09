import config from './config';
import moira from 'moira';

const hover = require('hover-api')(config.user, config.pass);
const domain = process.argv[2];
const subdomain = process.argv[3];

if(domain == undefined || subdomain == undefined) {
    console.error('Usage: node index parentdomain.com subdomain');
} else {
    console.log('Checking external IP');
    moira.getIP((err, ip, service) => {
        if(err) {
            // we've got an error back, throw it on the console and return
            console.error(err);
            return;
        }
        // output result to console
        console.log(`Received result from ${service}: ${ip}...`);
        hover.getDomainDns(domain, (ptr, res) => {
            const entry = res[0].entries.filter((entry) => entry.name === subdomain)[0];
            if(entry.content == ip) {
                console.log(`IP unchanged from ${ip}, no update necessary...`);
            } else {
                console.log(`IP on record (${entry.content}) does not match current IP (${ip}), removing old A record...`);
                hover.removeDns(entry.id, () => {
                    console.log('Creating new A record...');
                    hover.createARecord(domain, subdomain, ip, () => {
                        console.log(`A record for ${subdomain}.${domain}: ${ip}`);
                    });
                });
            }
        });
    });
}
