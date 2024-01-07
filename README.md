# auspost-notifier
 
Simple NodeJS script to check Auspost and give a notification via a Discord webhook whenever there's a new tracking event.

Bypasses Datadome by re-sending the request upon error, by which point the cookie is set.

## Instructions
Run `npm install` to grab the dependencies

Copy config.example.json into config.json and fill in the details as appropriate. Check interval is in miliseconds.

`node index.mjs` to launch the script.

I use pm2 to keep mine running in the background: `pm2 start index.mjs --name auspost-notifier`