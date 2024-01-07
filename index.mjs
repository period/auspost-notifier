const config = require("./config.json");
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));


var caughtException = false;

let countEventsLast = 0;

async function refreshTracking() {
    try {
        let response = await client.get("https://digitalapi.auspost.com.au/shipmentsgatewayapi/watchlist/shipments/" + config.tracking_number, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
                "Accept-Language": "en-AU",
                "Accept": "application/json",
                "DNT": 1,
                "Sec-GPC": 1,
                "Referer": "Https://auspost.com.au",
                "api-key": "d11f9456-11c3-456d-9f6d-f7449cb9af8e", // This appears to just be hardcoded
                "AP_CHANNEL_NAME": "WEB_DETAIL",
                "Origin": "https://auspost.com.au"
            }
        });
        caughtException = false; // Got a good response, reset it in case we hit Datadome again
        return response.data;
    } catch(exc) {
        // Almost certainly Datadome giving a 403, but we can just retry with the cookie we were given and there's a decent chance it'll work.
        if(caughtException == false) {
            caughtException = true;
            return refreshTracking();
        }
        throw exc; // Throw the exception if we've already tried
    }
}
function notify(event) {
    console.log("New event:");
    console.log(event);
    if(config.discord_webhook_url == null) return;
    client.post(config.discord_webhook_url, {
        content: "@everyone New tracking event: ```" + JSON.stringify(event, null, 2) + "```"
    }, {
        headers: {
            "Content-Type": "application/json"
        }
    });
}
async function check() {
    let tracking = await refreshTracking();

    if(!tracking.articles || tracking.articles.length == 0) {
        return console.log("No articles");
    }
    if(!tracking.articles[0].details || tracking.articles[0].details.length == 0) {
        return console.log("No tracking details");
    }
    if(!tracking.articles[0].details[0].events || tracking.articles[0].details[0].events.length == 0) {
        return console.log("No tracking detail events");
    }
    if(countEventsLast != tracking.articles[0].details[0].events.length) {
        notify(tracking.articles[0].details[0].events[0]);
        countEventsLast = tracking.articles[0].details[0].events.length;
    }
}
check();
setInterval(check, config.check_interval);