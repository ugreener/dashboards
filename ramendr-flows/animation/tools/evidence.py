#!/usr/bin/env python3
"""Download run-date screenshot attachments from a Jira ticket.

usage: tools/evidence.py <ticket> --date YYYY-MM-DD
writes public/evidence/<ticket>/<file> and src/<ticket>/evidence.json
Auth: Basic ugreener@redhat.com:$JIRA_API_TOKEN (never written anywhere).
"""
import argparse, base64, json, os, pathlib, re, urllib.request

ap = argparse.ArgumentParser()
ap.add_argument('ticket'); ap.add_argument('--date', required=True)
ap.add_argument('--user', default='ugreener@redhat.com')
a = ap.parse_args()
root = pathlib.Path(__file__).resolve().parent.parent
auth = 'Basic ' + base64.b64encode(f"{a.user}:{os.environ['JIRA_API_TOKEN']}".encode()).decode()
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'Authorization': auth})).read()
key = a.ticket.upper()
atts = json.loads(get(f'https://redhat.atlassian.net/rest/api/2/issue/{key}?fields=attachment'))['fields']['attachment']
out = root / 'public' / 'evidence' / a.ticket; out.mkdir(parents=True, exist_ok=True)
rows = []
for x in atts:
    fn = x['filename']
    if not fn.lower().endswith('.png') or a.date not in fn or not x['created'].startswith(a.date):
        continue
    if 'WRONG' in fn.upper():
        continue
    p = out / fn
    if not p.exists() or p.stat().st_size != x['size']:
        p.write_bytes(get(x['content']))
    m = re.search(re.escape(a.date) + r'-(\d+)-(.+)\.png$', fn)
    rows.append({'file': fn, 'id': x['id'], 'size': x['size'], 'created': x['created'],
                 'step': m.group(2) if m else None})
rows.sort(key=lambda r: r['file'])
(root / 'src' / a.ticket / 'evidence.json').write_text(json.dumps(rows, indent=1) + '\n')
print(f'{len(rows)} screenshots -> {out}')
