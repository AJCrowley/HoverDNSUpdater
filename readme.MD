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

Also, through your Hover control panel, I'd recommend setting the TTL on the domain to the minimum (15 mins).

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

## IMPORTANT NOTE / Hover API Login Not Working
The hover-api library stopped working with their login system. As such, I have had to modify the file:
```node_modules/hover-api/index.js```

If you experience problems related to logging into the API, open up this file and replace the _hoverRequest function with the following:

```js
function _hoverRequest (method, path, body, cb) {
        // Check if previously logged in
        if (_loggedin) return _hoverApiRequest(method, path, body, cb);

        // Issue login request with provided username / password
				// edit: use request.post with form instead of just request with json
        r.post({
            url: baseUrl + '/login',
            form: {
                username: username,
                password: password
            }
        }, _rCallback(function (err) {
            if(err) {
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