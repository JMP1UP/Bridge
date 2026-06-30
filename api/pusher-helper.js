// api/pusher-helper.js
// Zero-dependency Pusher REST API event trigger helper.
// Uses native Node.js crypto and fetch modules to avoid package compilation overhead.

const crypto = require('crypto');

const PUSHER_APP_ID = process.env.PUSHER_APP_ID;
const PUSHER_KEY = process.env.PUSHER_KEY;
const PUSHER_SECRET = process.env.PUSHER_SECRET;
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER || 'eu'; // Defaulting to EU as selected by user

const pusher = {
  trigger(channel, eventName, data) {
    if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET) {
      console.warn("Pusher environment variables not configured. Skipping live sync broadcast.");
      return Promise.resolve(null);
    }

    const path = `/apps/${PUSHER_APP_ID}/events`;
    const body = JSON.stringify({
      name: eventName,
      channels: [channel],
      data: JSON.stringify(data)
    });

    const bodyMd5 = crypto.createHash('md5').update(body, 'utf8').digest('hex');
    const timestamp = Math.floor(Date.now() / 1000);

    const params = {
      auth_key: PUSHER_KEY,
      auth_timestamp: timestamp,
      auth_version: '1.0',
      body_md5: bodyMd5
    };

    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys.map(k => `${k}=${params[k]}`).join('&');

    // Create signature
    const signatureInput = `POST\n${path}\n${queryString}`;
    const signature = crypto
      .createHmac('sha256', PUSHER_SECRET)
      .update(signatureInput)
      .digest('hex');

    const url = `https://api-${PUSHER_CLUSTER}.pusher.com${path}?${queryString}&auth_signature=${signature}`;

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body
    })
      .then(async res => {
        if (!res.ok) {
          const errText = await res.text();
          console.warn(`Pusher REST API failed (${res.status}):`, errText);
        }
      })
      .catch(err => {
        console.error("Pusher trigger request failure:", err);
      });
  }
};

module.exports = pusher;
