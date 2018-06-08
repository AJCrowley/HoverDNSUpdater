# Hover Dynamic DNS Host Updater

A simple script to update a hover domain with the current computer's IP.

Edit config.js with your account login info, and the domain that you wish to control.

Put it in your scheduled tasks to keep the host up to date.

```
Usage:
node index [domain] [subdomain]
```

So for example, the following will updated the domain for test.thiscomputer.com
```node index thiscomputer.com test```

This will set the A record for the domain