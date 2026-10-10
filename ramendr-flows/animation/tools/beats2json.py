#!/usr/bin/env python3
"""Export the visual fields of <ticket>/beats.yaml to src/<ticket>/beats.json (committed).

usage: tools/beats2json.py <ticket>
Keeps beats.yaml the single source for screenshots, captions, definitions and glossary cards.
"""
import json, os, sys, yaml
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t = sys.argv[1]
beats = yaml.safe_load(open(os.path.join(ROOT, t, 'beats.yaml')))['beats']
keep = ('chapter', 't', 'screenshot', 'focus', 'caption', 'define', 'card', 'def', 'unverified')
out = {str(b['id']): {k: b[k] for k in keep if k in b} for b in beats}
json.dump(out, open(os.path.join(ROOT, 'src', t, 'beats.json'), 'w'), indent=1)
print(len(out), 'beats ->', f'src/{t}/beats.json')
