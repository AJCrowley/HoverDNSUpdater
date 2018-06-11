# Hover Dynamic DNS Host Updater

## Description

A simple script to update a hover domain with the current computer's IP. I could have easily written this in ES5 javascript, but I like ES6, and it's my project, so it uses babel-register to run ES6 code on Node.js with the need to transpile. The ```index.js``` file loads babel-register, then includes our ES6 code file, which contains all of our logic, ```hoverdyndns.js```.

## Usage

If you don't already have it, you'll need to install node.js.

Edit config.js with your account login info.

To install dependencies, from the folder that you've cloned/downloaded the repo to:

```
npm install
```

Put it in your scheduled tasks or crontab to keep the host up to date. I've set it to run hourly, but set it up however works best for you.

Instructions are included at the end of this file for how to set the TTL on the A record, controlled through a value in the ```config.js``` file that also holds your account login info. If you don't wish to make the modification to set this up, I'd recommend decreasing the TTL for the record in your Hover control panel (5 mins is the lowest allowed through their CP, but through the config file, you can set it to any value you wish, I have it defaulted to 3 mins). Since you likely have to perform the other mod to the hover-api library to get anything at all to work due to issues with their API login system and javascript library, it's worth doing the mod so that you can set TTL to whatever you wish.

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
The hover-api library stopped working with their login system. As such, I have had to modify the file ```node_modules/hover-api/index.js```.

If you experience problems related to logging into the API, open up this file and replace the ```_hoverRequest``` function with the following:

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

If you wish to set the TTL to any value other than 900 (15 mins) on any new or updated A records, in the same file replace the ```createARecord``` function with the following:

```js
// edit: add ttl as a parameter to this function
function createARecord (domain, subdomain, ip, cb, ttl) {
    var body = {
        name: subdomain,
        type: 'A',
        content: ip,
        // edit: specify default TTL
        ttl: ttl
    };
    _hoverRequest('POST', '/domains/' + domain + '/dns', body, cb);
}
```

You can now edit the TTL value in ```config.js``` along with your login data in order to specify the default TTL, I have mine set to 180 (3 mins), but set yours to whatever suits you.