import React, { useEffect, useState } from 'react';

export default function SiteVisits({ api, onSessionExpired }) {
  const [visits, setVisits] = useState([]), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [query, setQuery] = useState(''), [status, setStatus] = useState('All');
  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try { const result = await api('/api/tasks'); if (mounted) { setVisits(result.tasks.filter(task => task.task_type === 'site_visit')); setError(''); } }
      catch (e) { if (mounted) { setError(e.message); if (e.status === 401) onSessionExpired(); } }
      finally { if (mounted) setLoading(false); }
    }
    refresh(); const timer = setInterval(refresh, 30000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);
  async function refresh() {
    setLoading(true);
    try { const result = await api('/api/tasks'); setVisits(result.tasks.filter(task => task.task_type === 'site_visit')); setError(''); }
    catch (e) { setError(e.message); if (e.status === 401) onSessionExpired(); }
    finally { setLoading(false); }
  }
  const visible = visits.filter(visit => (status === 'All' || visit.status === status) && [visit.title, visit.assignee_name, visit.site_address].join(' ').toLowerCase().includes(query.toLowerCase()));
  return <section className="tasks-page"><div className="tasks-heading"><div><span className="assignment-count">{visits.length} site {visits.length === 1 ? 'visit' : 'visits'}</span><p>Latest employee coordinates for the site visits you can access. Updates every 30 seconds.</p></div></div>{error && <div className="alert error" role="alert">{error}</div>}<section className="card task-list"><div className="task-toolbar"><label className="task-search"><span className="sr-only">Search site visits</span><input placeholder="Search employee, site, or task..." value={query} onChange={e => setQuery(e.target.value)} /></label><label><span className="sr-only">Visit status</span><select value={status} onChange={e => setStatus(e.target.value)}>{['All', 'To do', 'In progress', 'Done'].map(value => <option key={value}>{value}</option>)}</select></label><button className="secondary" disabled={loading} onClick={refresh}>Refresh</button></div><div className="employee-table"><table><thead><tr><th>Visit / site</th><th>Assigned to</th><th>Status</th><th>Latitude</th><th>Longitude</th><th>Last captured</th><th>Accuracy</th><th>Sharing</th><th>Map</th></tr></thead><tbody>{visible.map(visit => { const point = visit.location, hasPoint = point?.latitude != null && point?.longitude != null; return <tr key={visit.id}><td><div className="task-name">{visit.title}</div><p className="task-description">{visit.site_address}</p></td><td>{visit.assignee_name}</td><td><span className="badge">{visit.status}</span></td><td className="coordinate">{hasPoint ? point.latitude.toFixed(6) : '—'}</td><td className="coordinate">{hasPoint ? point.longitude.toFixed(6) : '—'}</td><td>{hasPoint ? new Date(point.captured_at * 1000).toLocaleString() : 'Not shared'}</td><td>{hasPoint ? `±${Math.round(point.accuracy)} m` : '—'}</td><td><span className={point?.is_recent ? 'location-recent' : 'unassigned'}>{point?.is_recent ? 'Recent update' : point?.active ? hasPoint ? 'Updates delayed' : 'Waiting for location' : hasPoint ? 'Stopped' : 'Not sharing'}</span></td><td>{hasPoint ? <a className="location-map" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=17/${point.latitude}/${point.longitude}`}>View map &#8599;</a> : '—'}</td></tr>; })}</tbody></table></div>{(loading || !visible.length) && <p className="employee-empty">{loading ? 'Loading visits...' : visits.length ? 'No visits match these filters.' : 'No site-visit tasks assigned yet.'}</p>}</section><p className="mapping-hint">Coordinates appear after the employee starts sharing in the mobile app. A stopped or delayed location is the last recorded point, not a live position.</p></section>;
}
