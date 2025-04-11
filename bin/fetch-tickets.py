#!/usr/bin/env python3
import json
import os
import requests
import urllib3
import shutil
import time

JIRA_API_URL = 'https://jira.greenpeace.org/rest/api/latest/issue/'
TICKET_MAX_NUMBER = 8000
TICKET_KEY_PREFIX = 'PLANET-'
TICKETS_FILE = '../tickets.json'
TICKETS_PATH = '../tickets/'


def save_attachment(attachment, ticket_key):
    os.makedirs('{0}attachments/PLANET-{1}/thumbs'.format(TICKETS_PATH, ticket_key), exist_ok=True)

    try:
        thumbnail_response = requests.get(attachment['thumbnail'], verify=False)
    except KeyError:
        thumbnail_response = False
        shutil.copy('../static/thumbnail.png',
                    '{0}attachments/PLANET-{1}/thumbs/{2}'.format(TICKETS_PATH,
                                                                  ticket_key,
                                                                  attachment['filename']))

    if thumbnail_response:
        with open('{0}attachments/PLANET-{1}/thumbs/{2}'.format(TICKETS_PATH,
                                                                ticket_key,
                                                                attachment['filename']),
                  mode="wb") as file:
            file.write(thumbnail_response.content)

    attachment_response = requests.get(attachment['content'], verify=False)
    with open('{0}attachments/PLANET-{1}/{2}'.format(TICKETS_PATH,
                                                     ticket_key,
                                                     attachment['filename']), mode="wb") as file:
        file.write(attachment_response.content)


if __name__ == '__main__':
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    ticket_key = 1

    with open(TICKETS_FILE, 'w') as f:
        json.dump({}, f)

    while ticket_key < TICKET_MAX_NUMBER:
        print('Trying ticket {0}...'.format(ticket_key))
        api_endpoint = '{0}{1}{2}'.format(
            JIRA_API_URL,
            TICKET_KEY_PREFIX,
            ticket_key
        )
        response = requests.get(api_endpoint, verify=False)

        if response.status_code != 200:
            print('Not a ticket. Moving on\n')
            ticket_key += 1
            continue

        print('Getting information...\n')
        try:
            fields = response.json()['fields']
        except KeyError:
            print('Not a valid ticket. Moving on\n')
            ticket_key += 1
            continue

        with open('{0}{1}{2}.json'.format(TICKETS_PATH,
                                          TICKET_KEY_PREFIX,
                                          ticket_key), 'w') as json_file:
            json_file.write(json.dumps(response.json(), indent=2, sort_keys=True))

        for attachment in fields['attachment']:
            save_attachment(attachment, ticket_key)

        with open(TICKETS_FILE, mode='r') as file:
            data = json.load(file)
            new_record = {
                '{0}{1}'.format(TICKET_KEY_PREFIX, ticket_key): {
                    'summary': fields['summary']
                }
            }
            data.update(new_record)

        with open(TICKETS_FILE, mode='w') as file:
            json.dump(data, file, indent=2)

        ticket_key += 1

        if ticket_key % 800 == 0:
            print('Sleeping for 1 hour and a minute')
            time.sleep(3660)
