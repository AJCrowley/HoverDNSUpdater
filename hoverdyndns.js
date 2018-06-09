import config from './config';
import moira from 'moira';

const hover = require('hover-api')(config.user, config.pass);
const domain = process.argv[2];
const subdomain = process.argv[3];

// check that we've been passed a domain and subdomain
if(domain == undefined || subdomain == undefined) {
    // params not passed, provide usage notification to user
    console.error('Usage: node index parentdomain.com subdomain');
} else {
    // we have everything we need, get our IP address
    console.log('Checking external IP');
    moira.getIP((err, ip, service) => {
        if(err) {
            // we've got an error back, throw it on the console and return
            console.error(err);
            return;
        }
        // output result to console
        console.log(`Received result from ${service}: ${ip}...`);
        // get list of domains from Hover
        hover.getDomainDns(domain, (ptr, res) => {
            // filter results for our subdomain
            const entry = res[0].entries.filter((entry) => entry.name === subdomain)[0];
            // check IP on A record vs our recent request, do they match?
            if(entry.content == ip) {
                // they do match, we don't need to do anything else
                console.log(`IP unchanged from ${ip}, no update necessary...`);
            } else {
                // new IP, let the user know
                console.log(`IP on record (${entry.content}) does not match current IP (${ip}), removing old A record...`);
                // remove old A record
                hover.removeDns(entry.id, () => {
                    console.log('Creating new A record...');
                    // create new A record with current IP
                    hover.createARecord(domain, subdomain, ip, () => {
                        // all done!
                        console.log(`A record for ${subdomain}.${domain}: ${ip}`);
                    });
                });
            }
        });
    });
}
