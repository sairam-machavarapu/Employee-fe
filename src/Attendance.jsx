import React, { useEffect, useRef, useState } from 'react';

const labels = { Present: 'P', Absent: 'A', Leave: 'L', Unmarked: '—' };
const roleLabel = role => role === 'manager' ? 'Manager' : 'Employee';
export default function Attendance({ user, api, onSessionExpired }) {
  const teamDropdownRef = useRef(null);
  useEffect(() => {
    function closeOutside(event) {
      const dropdown = teamDropdownRef.current;
      if (dropdown?.open && !dropdown.contains(event.target)) dropdown.open = false;
    }
    document.addEventListener('pointerdown', closeOutside, true);
    return () => document.removeEventListener('pointerdown', closeOutside, true);
  }, []);
  const today = new Date();
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [data, setData] = useState({ people: [], teams: [], records: [] });
  const [selectedTeams, setSelectedTeams] = useState([]), [personId, setPersonId] = useState('all');
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [mark, setMark] = useState(null);
  async function load() {
    setLoading(true); setError('');
    try { setData(await api('/api/attendance?month=' + encodeURIComponent(month))); }
    catch (e) { setData({ people: [], teams: [], records: [] }); setError(e.message); if (e.status === 401) onSessionExpired(); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (/^\d{4}-\d{2}$/.test(month)) load(); }, [month, user.id]);
  const [year, monthNumber] = month.split('-').map(Number);
  const days = new Date(year, monthNumber, 0).getDate();
  const dayNumbers = Array.from({ length: days || 0 }, (_, i) => i + 1);
  const dayString = day => `${month}-${String(day).padStart(2, '0')}`;
  const recordMap = new Map(data.records.map(record => [`${record.user_id}:${record.day}`, record.status]));
  const statusFor = (id, day) => recordMap.get(`${id}:${dayString(day)}`) || 'Unmarked';
  const teamPeople = new Set(data.teams.filter(team => selectedTeams.includes(team.id)).flatMap(team => [...team.employee_ids, team.manager_id]));
  const filteredPeople = data.people.filter(person => (!selectedTeams.length || teamPeople.has(person.id)) && (personId === 'all' || person.id === Number(personId)));
  const selectedRecords = data.records.filter(record => filteredPeople.some(person => person.id === record.user_id));
  const counts = status => selectedRecords.filter(record => record.status === status).length;
  const canMark = person => user.role === 'superuser' || (user.role === 'manager' && person.role === 'employee');
  async function save(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { await api('/api/attendance', { user_id: mark.person.id, day: mark.day, status: mark.status, night_shift: !!mark.night_shift, night_hours: mark.night_shift ? String(mark.night_hours) : '0' }); setMark(null); setNotice('Attendance saved.'); await load(); }
    catch (e) { setError(e.message); if (e.status === 401) onSessionExpired(); }
    finally { setBusy(false); }
  }
  function dayCell(person, day, calendar = false) {
    const status = statusFor(person.id, day), dateString = dayString(day);
    const nightShift = !!data.records.find(record => record.user_id === person.id && record.day === dateString)?.night_shift;
    const title = `${person.name}: ${dateString}, ${status}${nightShift ? ', night shift' : ''}`;
    const contents = calendar ? <><span className="calendar-number">{day}</span><span className="calendar-status">{status}{nightShift ? ' ? Night' : ''}</span></> : nightShift ? 'P/N' : labels[status];
    return canMark(person) ? <button disabled={busy} className={`attendance-day ${status.toLowerCase()} ${calendar ? 'calendar-cell' : ''}`} aria-label={'Mark ' + title} title={title} onClick={() => { setError(''); setNotice(''); setMark({ person, day: dateString, status, night_shift: nightShift, night_hours: String((data.records.find(record => record.user_id === person.id && record.day === dateString)?.night_hours_hundredths || 0) / 100) }); }}>{contents}</button> : <div className={`attendance-day ${status.toLowerCase()} ${calendar ? 'calendar-cell' : ''}`} aria-label={title} title={title}>{contents}</div>;
  }
  return <section className="attendance-page">
    <div className="tasks-heading"><div><p>{user.role === 'employee' ? 'See which days you were present, absent, or on leave.' : user.role === 'manager' ? 'View your attendance and mark attendance for employees in your teams.' : 'View and mark Manager and Employee attendance across multiple teams.'}</p></div><label className="month-picker">Month<input type="month" required value={month} onChange={e => { if (e.target.value) { setMonth(e.target.value); setNotice(''); } }} /></label></div>
    {error && !mark && <div className="alert error" role="alert">{error}</div>}{notice && <div className="alert success" role="status">{notice}</div>}
    {user.role !== 'employee' && <section className="card attendance-filters"><label>Person<select value={personId} onChange={e => setPersonId(e.target.value)}><option value="all">All visible people</option>{data.people.map(person => <option key={person.id} value={person.id}>{person.name}{person.id === user.id ? ' (you)' : ''} — {roleLabel(person.role)}</option>)}</select></label><div className="team-filter"><span id="team-filter-label" className="filter-label">Teams</span><details ref={teamDropdownRef} className="team-dropdown" onKeyDown={e => { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary').focus(); } }}><summary aria-labelledby="team-filter-label team-filter-value"><span id="team-filter-value">{!selectedTeams.length ? 'All teams' : selectedTeams.length === 1 ? data.teams.find(team => team.id === selectedTeams[0])?.name || '1 team selected' : `${selectedTeams.length} teams selected`}</span><span aria-hidden="true">&#8964;</span></summary><div className="team-dropdown-menu"><button type="button" className="team-filter-reset" onClick={() => { setSelectedTeams([]); setPersonId('all'); }}>Show all teams</button><div className="attendance-team-options">{data.teams.map(team => <label key={team.id}><input type="checkbox" checked={selectedTeams.includes(team.id)} onChange={e => { setSelectedTeams(e.target.checked ? [...selectedTeams, team.id] : selectedTeams.filter(id => id !== team.id)); setPersonId('all'); }} />{team.name}</label>)}{!data.teams.length && <span className="unassigned">No teams assigned.</span>}</div><p>Select one or more teams.</p></div></details></div><button className="secondary" onClick={load} disabled={busy || loading}>Refresh</button></section>}
    <div className="attendance-summary">{['Present', 'Absent', 'Leave'].map(status => <div className={'card summary-item ' + status.toLowerCase()} key={status}><span>{status}</span><strong>{counts(status)}</strong><small>{filteredPeople.length === 1 ? 'days this month' : 'person-days this month'}</small></div>)}<div className="card summary-item"><span>Unmarked</span><strong>{filteredPeople.length * days - selectedRecords.length}</strong><small>not recorded</small></div></div>
    <div className="attendance-legend">{Object.entries(labels).map(([status, symbol]) => <span key={status}><i className={'attendance-day ' + status.toLowerCase()}>{symbol}</i>{status}</span>)}{user.role !== 'employee' && <small>Select a day to mark attendance. P/N = night shift.</small>}</div>
    {loading ? <section className="card employee-empty" role="status">Loading attendance...</section> : filteredPeople.length === 1 ? <section className="card attendance-calendar"><div className="calendar-title"><div><h2>{filteredPeople[0].name}{filteredPeople[0].id === user.id ? ' (you)' : ''}</h2><p>{new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p></div><span className={'badge ' + filteredPeople[0].role}>{roleLabel(filteredPeople[0].role)}</span></div><div className="calendar-grid">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span className="weekday" key={day}>{day}</span>)}{Array.from({ length: new Date(year, monthNumber - 1, 1).getDay() }, (_, index) => <span key={'blank' + index} />)}{dayNumbers.map(day => <div key={day}>{dayCell(filteredPeople[0], day, true)}</div>)}</div><p className="mapping-hint">Unmarked dates have no attendance record. Weekends are not automatically marked absent.</p></section> : <section className="card attendance-list"><div className="employee-table"><table><thead><tr><th>Person</th>{dayNumbers.map(day => <th key={day}><span>{day}</span><small>{new Date(year, monthNumber - 1, day).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</small></th>)}<th>Present</th></tr></thead><tbody>{filteredPeople.map(person => <tr key={person.id}><td><strong>{person.name}{person.id === user.id ? ' (you)' : ''}</strong><small>{roleLabel(person.role)}</small></td>{dayNumbers.map(day => <td key={day}>{dayCell(person, day)}</td>)}<td>{data.records.filter(record => record.user_id === person.id && record.status === 'Present').length}</td></tr>)}</tbody></table></div>{!filteredPeople.length && <p className="employee-empty">No people match the selected filters.</p>}</section>}
    {mark && <div className="mapping-overlay" onClick={() => !busy && setMark(null)}><section className="card attendance-dialog" role="dialog" aria-modal="true" aria-labelledby="attendance-dialog-title" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape' && !busy) setMark(null); if (e.key === 'Tab') { const controls = [...e.currentTarget.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled)')]; if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls.at(-1).focus(); } else if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0].focus(); } } }}><h2 id="attendance-dialog-title">Mark attendance</h2><p className="subtitle">{mark.person.name} · {mark.day}</p>{error && <div className="alert error" role="alert">{error}</div>}<form onSubmit={save}><label>Status<select autoFocus value={mark.status} onChange={e => setMark({ ...mark, status: e.target.value, night_shift: e.target.value === 'Present' ? mark.night_shift : false })}>{Object.keys(labels).map(status => <option key={status}>{status}</option>)}</select></label>{mark.status === 'Present' && <label className="night-shift-check"><input type="checkbox" checked={!!mark.night_shift} onChange={e => setMark({ ...mark, night_shift: e.target.checked })} />Worked a night shift</label>}{mark.status === 'Present' && mark.night_shift && <label>Night hours worked<input type="number" inputMode="decimal" required min="0.01" max="24" step="0.01" placeholder="e.g. 6.5" value={mark.night_hours} onChange={e => setMark({ ...mark, night_hours: e.target.value })} /></label>}<p className="mapping-hint">Night-shift extra pay = hours worked ? the hourly rate set for this month.</p><div className="task-form-actions"><button className="secondary" type="button" disabled={busy} onClick={() => setMark(null)}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving...' : 'Save attendance'}</button></div></form></section></div>}
  </section>;
}
