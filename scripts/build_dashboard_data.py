#!/usr/bin/env python3
"""Build dashboard/command-center.json for the Aurelium Motion Command Center dashboard.

Inputs:
  dashboard/state.json           team state the Chief of Staff maintains (departments, agents, approvals, blockers, findings, delivery, finance, content, outreach)
  <hq_export_dir> (optional)     folder of ArtifactData exports from Aurelium Motion HQ: leads/*.json, activities/*.json, appointments/*.json, proposals/*.json
Output:
  dashboard/command-center.json  aggregates only. No business names, people, phones or emails from HQ ever land here.
Usage: python3 scripts/build_dashboard_data.py [hq_export_dir]
"""
import json, sys, os, glob, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
state = json.load(open(os.path.join(ROOT, 'dashboard', 'state.json')))
hq_dir = sys.argv[1] if len(sys.argv) > 1 else None
today = datetime.date.today()
out = dict(state)
out['synced_at'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

STAGES = ['new','contacted','qualified','call','proposal','negotiation','won','lost']
STAGE_LABEL = {'new':'New lead','contacted':'Contacted','qualified':'Qualified','call':'Call booked','proposal':'Proposal sent','negotiation':'Negotiation','won':'Won','lost':'Lost'}
ALIAS = {'replied':'qualified','demo':'call'}

def load(col):
    if not hq_dir: return []
    rows = []
    for f in glob.glob(os.path.join(hq_dir, col, '*.json')):
        d = json.load(open(f))
        rows.append(d.get('data', d))
    return rows

leads = load('leads'); acts = load('activities'); appts = load('appointments'); props = load('proposals')
if leads:
    st = collections.Counter(); val = collections.Counter()
    camp = collections.defaultdict(lambda: collections.Counter())
    ind = collections.Counter()
    for l in leads:
        s = ALIAS.get(l.get('stage'), l.get('stage') or 'new')
        if s not in STAGES: s = 'new'
        st[s] += 1
        val[s] += float(l.get('setup') or 0) + float(l.get('monthly') or 0)
        c = l.get('campaign') or 'No campaign'
        camp[c]['leads'] += 1
        if s in ('won',): camp[c]['won'] += 1
        elif s == 'lost': camp[c]['lost'] += 1
        elif s != 'new': camp[c]['in_progress'] += 1
        else: camp[c]['untouched'] += 1
        ind[l.get('industry') or 'Unknown'] += 1
    out['hq_stages'] = [{'stage': STAGE_LABEL[s], 'order': i, 'leads': st[s], 'value': round(val[s])} for i, s in enumerate(STAGES)]
    out['hq_campaigns'] = [dict(campaign=c, leads=v['leads'], untouched=v['untouched'], in_progress=v['in_progress'], won=v['won'], lost=v['lost']) for c, v in sorted(camp.items(), key=lambda x: -x[1]['leads'])]
    out['hq_industries'] = [{'industry': k, 'leads': v} for k, v in ind.most_common()]
    # activity by day, last 14 days
    byday = collections.Counter(); outbound = collections.Counter()
    for a in acts:
        d = (a.get('at') or '')[:10]
        if not d: continue
        byday[d] += 1
        if a.get('type') in ('call','email_sent','sms_sent','meeting'): outbound[d] += 1
    days = [(today - datetime.timedelta(days=i)).isoformat() for i in range(13, -1, -1)]
    out['hq_activity'] = [{'day': d, 'activities': byday[d], 'outbound': outbound[d]} for d in days]
    open_leads = sum(st[s] for s in STAGES if s not in ('won','lost'))
    out['hq_summary'] = [{'total_leads': len(leads), 'open_leads': open_leads, 'won': st['won'], 'lost': st['lost'], 'call_booked': st['call'], 'proposals_sent': st['proposal'], 'appointments': len(appts), 'proposals_docs': len(props), 'activities_14d': sum(byday[d] for d in days)}]
else:
    out.setdefault('hq_stages', []); out.setdefault('hq_campaigns', []); out.setdefault('hq_industries', []); out.setdefault('hq_activity', []); out.setdefault('hq_summary', [])

json.dump(out, open(os.path.join(ROOT, 'dashboard', 'command-center.json'), 'w'), indent=1)
print('wrote dashboard/command-center.json', {k: (len(v) if isinstance(v, list) else v) for k, v in out.items() if k != 'synced_at'})
