# Hover Dynamic DNS Host Updater

## Description

A simple script to update a hover domain with the current computer's IP.

## Usage

If you don't already have it, you'll need to install node.js.

Edit config.js with your account login info.

To install dependencies, from the folder that you've cloned/downloaded the repo to:

```
npm install
```

Put it in your scheduled tasks or crontab to keep the host up to date. I've set it to run hourly, but set it up however works best for you.

Also, through your Hover control panel, I'd recommend setting the TTL on the domain to the minimum (5 mins).

```
Usage:
node index [domain] [subdomain] [*ip]
```

So for example, the following will update the A record for the domain test.thiscomputer.com. If there's no entry for the specified subdomain, this script will create one.

```
node index thiscomputer.com test
```

You can also optionally specify an IP, rather than using the built in IP detection:

```
node index thiscomputer.com test 127.0.0.1
```

If you wish to specify a wildcard, make sure to enclose it in quotes so it doesn't try to recurse the filesystem as input:

```
# set dns wildcard so any undefined subdomains point to this address
node index thiscomputer.com '*'
# set entry for the base domain
node index thiscomputer.com @
```

## IMPORTANT NOTE / Hover API Login Not Working
The hover-api library stopped working with their login system. As such, I have had to modify the file:
```node_modules/hover-api/index.js```

If you experience problems related to logging into the API, open up this file and replace the _hoverRequest function with the following:

```js
function _hoverRequest (method, path, body, cb) {
    // Check if previously logged in
    if (_loggedin) return _hoverApiRequest(method, path, body, cb);

    // edit: issue login request with request.post with form instead of just request with json
    r.post({
        url: baseUrl + '/login',
        form: {
            username: username,
            password: password
        }
    }, _rCallback(function (err) {
        if(err) {
            // edit: check if cb exists, otherwise just dump to console
            if(cb !== undefined) {
                return cb(err)
            } else {
                console.error(err);
                return;
            }
        }

        // Note logged in / forward request
        _loggedin = true;
        _hoverApiRequest(method, path, body, cb);
    }));
}
```

This should resolve the API login issue.

If you wish to set the TTL to any value other than 900 (15 mins) on any new or updated A records, in the same file replace the createARecord function with the following:

```js
function createARecord (domain, subdomain, ip, cb) {
    var body = {
        name: subdomain,
        type: 'A',
        content: ip,
        // edit: specify default TTL of whatever you wish, let's go with 1 min
        ttl: 60
    };
    _hoverRequest('POST', '/domains/' + domain + '/dns', body, cb);
}
```