# Greenpeace Planet 4 Jira archive

![Planet4](./planet4.png)

## Fetching API data

The two scripts within `bin/` are responsible for fetching all ticket information
from Jira Server API and then uploading all the data to a GCP bucket.

The python script that fetches the data has an artificial delay to avoid rate limiting.
So it would take a few hours to complete.

```bash
cd bin
./jira-archive.py
./upload-tickets.sh
```

## Testing locally

If you want to testing things locally, running the python script will get all the data.
But you need to change the two constants at the top of `static/app.js` and adjust the
`base` head meta tag on `index.html`.