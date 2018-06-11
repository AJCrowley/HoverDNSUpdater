import config from './config';
import moira from 'moira';
import hoverApi from 'hover-api';

const hover = hoverApi(config.user, config.pass);
const domain = process.argv[2];
const subdomain = process.argv[3];
let ip = process.argv[4];

// check that we've been passed a domain and subdomain
if(domain === undefined || subdomain === undefined) {
    // params not passed, provide usage notification to user
    console.info('Usage: node index [parent domain] [subdomain] [*ip]');
    console.info('IP parameter is optional, if not specified, this script will automatically detect our current IP');
    console.info('parent domain and subdomain params are both required')
} else {
    // encapsulate actions in a function
    const processDns = (err, moiraIp, service) => {
        // if we got a service back, this is a callback from moira's getIP function
        if(service !== undefined) {
            // check for errors
            if(err) {
                // we've got an error back, throw it on the console and return
                console.error(err);
                // nothing to do, exit
                return;
            }
            // set our IP
            ip = moiraIp;
            // output result to console
            console.info(`Received result from ${service}: ${ip}...`);
        } else {
            // an IP was provided, check that it's valid with a regexp
            if(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
                // IP provided is valid
                console.info(`Using user specified IP of ${ip}...`);
            } else {
                // invalid IP provided
                console.error(`${ip} is not a valid IP address...`);
                // exit
                return;
            }
        }
        // get list of domains from Hover
        hover.getDomainDns(domain, (err, res) => {
            // did we get any results back?
            if(res === undefined) {
                // no, this is not our domain
                console.error(`The domain ${domain} is not on your Hover account...`);
            } else {
                // filter results for our subdomain
                const entry = res[0].entries.filter((entry) => entry.name === subdomain)[0];
                // next step depends on whether this is an update or a completely new A record
                const updateRecords = entry === undefined ? (entry, callback) => {
                    // no A record exists, notify user
                    console.info(`No entry for domain ${subdomain}.${domain}, creating A record for ${ip}...`);
                    // callback for next step
                    callback();
                } : (entry, callback) => {
                    // there is already an A record, does the IP already match?
                    if(entry.content === ip) {
                        // they do match, we don't need to do anything else
                        console.info(`IP unchanged from ${ip}, no update necessary...`);
                    } else {
                        // new IP, let the user know
                        console.info(`IP on record (${entry.content}) does not match current IP (${ip}), removing old A record...`);
                        // remove old A record
                        hover.removeDns(entry.id, () => {
                            // callback for next step
                            callback();
                        });
                    }
                };
                // call function defined above
                updateRecords(entry, () => {
                    console.info('Creating new A record...');
                    // create new A record with current IP
                    hover.createARecord(domain, subdomain, ip, () => {
                        // all done! just notify user. If there were any other cleanup to do, we'd put it here also
                        console.info(`A record for ${subdomain}.${domain}: ${ip}`);
                    });
                });
            }
        });
    };
    // were we passed an IP to use? Use moira if not, just callback if we already have an IP
    const getIp = ip === undefined ? (callback) => moira.getIP(callback) : (callback) => callback();
    // call our main function
    getIp(processDns);
}
