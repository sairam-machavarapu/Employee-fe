import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import './style.css';
import './workspace.css';
import Tasks from './Tasks';
import SiteVisits from './SiteVisits';
import Attendance from './Attendance';
import Modal from './Modal';
import Profile from './Profile';
import Payroll from './Payroll';

const roles = { superuser: 'Super User', manager: 'Manager', employee: 'Employee' };
const emptyAccount = { name: '', email: '', password: '', role: 'employee', team_ids: [] };
const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function api(path, data) {
  const response = await fetch(apiBaseUrl + path, {
    method: data ? 'POST' : 'GET', credentials: 'include',
    headers: data ? { 'Content-Type': 'application/json', 'X-Requested-With': 'app' } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok) { const error = new Error(result.error || 'Request failed.'); error.status = response.status; throw error; }
  return result;
}

function NavIcon({ name }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    employees: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-4-5"/></>,
    managers: <><circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3M9 14l3 4 3-4M12 18v3"/></>,
    team: <><rect x="8" y="3" width="8" height="5" rx="1"/><rect x="2" y="16" width="8" height="5" rx="1"/><rect x="14" y="16" width="8" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/></>,
    tasks: <><rect x="5" y="4" width="15" height="17" rx="2"/><path d="M9 4V2h7v2M9 11l2 2 5-5M9 17h7"/></>,
    visits: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    attendance: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 16l3 3 5-5"/></>,
    payroll: <><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M2 10h20M15 15h4M5 3h12"/></>,
  };
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

// ── Page components ────────────────────────────────────────────────────────────

function OverviewPage({ user, canManage, users, teams, employees, managers, setAccount, setError, setNotice, setShowAccount, teamLoading, openMapping, refreshUsers, refreshTeams }) {
  return canManage ? (
    <div className="overview-directory">
      <div className="tasks-heading">
        <p>Manage workspace accounts and access.</p>
        <button className="primary add-team-trigger" onClick={() => { setAccount({ ...emptyAccount }); setError(''); setNotice(''); setShowAccount(true); }}>
          {user.role === 'manager' ? 'Add employee' : 'Add account'} +
        </button>
      </div>
      <section className="card members">
        <div className="section-title">
          <span className="icon-box">◇</span>
          <div>
            <h2>{user.role === 'manager' ? 'Your employees' : 'Team accounts'} <span className="count">{users.length}</span></h2>
            <p>Everyone with access to your workspace.</p>
          </div>
        </div>
        <div className="member-list">
          {users.map(member => (
            <div className="member" key={member.id}>
              <span className="avatar">{member.name.slice(0, 1).toUpperCase()}</span>
              <div className="member-info">
                <strong>{member.name}{member.id === user.id && <small> (you)</small>}</strong>
                <span>{member.email}</span>
              </div>
              <span className={'badge ' + member.role}>{roles[member.role]}</span>
            </div>
          ))}
        </div>
        <p className="member-note">
          {user.role === 'manager' ? 'You can create Employee accounts and allocate employees to teams you manage.' : 'Super Users can create accounts, assign roles, and assign team managers.'}
        </p>
      </section>
    </div>
  ) : (
    <section className="card role-home">
      <span className="welcome-symbol">{user.role === 'manager' ? '◇' : '○'}</span>
      <h2>{roles[user.role]} workspace</h2>
      <p>Your account is ready. Workspace features will appear here as they're added.</p>
    </section>
  );
}

function EmployeesPage({ user, canManage, employees, teams, teamLoading, busy, openMapping, setAccount, setError, setNotice, setShowAccount }) {
  if (!canManage) return <Navigate to="/" replace />;
  return (
    <section className="card employees-card">
      <div className="section-title">
        <span className="icon-box">?</span>
        <div>
          <h2>Account directory <span className="count">{employees.length}</span></h2>
          <p>Employee accounts in your workspace.</p>
        </div>
        <button className="primary add-team-trigger" onClick={() => { setAccount({ ...emptyAccount }); setError(''); setNotice(''); setShowAccount(true); }}>
          Add employee +
        </button>
      </div>
      <div className="employee-table">
        <table>
          <thead><tr><th>Name</th><th>Email address</th><th>Role</th><th>Teams</th><th>Actions</th></tr></thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td><span className="employee-name"><span className="avatar">{employee.name.slice(0, 1).toUpperCase()}</span>{employee.name}</span></td>
                <td>{employee.email}</td>
                <td><span className="badge employee">Employee</span></td>
                <td>
                  <div className="team-tags">
                    {teams.filter(team => team.employee_ids.includes(employee.id)).map(team => <span className="badge team-badge" key={team.id}>{team.name}</span>)}
                    {!teams.some(team => team.employee_ids.includes(employee.id)) && <span className="unassigned">Unassigned</span>}
                  </div>
                </td>
                <td><button className="primary table-action" disabled={teamLoading || busy} onClick={() => openMapping('employee', employee)}>Assign teams</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!employees.length && <p className="employee-empty">No employees yet. Select Add employee to create the first account.</p>}
      </div>
    </section>
  );
}

function ManagersPage({ user, managers, teams, users, busy, setAccount, setError, setNotice, setShowAccount, navigate }) {
  if (user.role !== 'superuser') return <Navigate to="/" replace />;
  return (
    <section className="card employees-card">
      <div className="section-title">
        <span className="icon-box">&#9672;</span>
        <div>
          <h2>Account directory <span className="count">{managers.length}</span></h2>
          <p>All manager accounts and their assigned teams.</p>
        </div>
        <button className="primary add-team-trigger" onClick={() => { setAccount({ ...emptyAccount, role: 'manager' }); setError(''); setNotice(''); setShowAccount(true); }}>
          Add manager +
        </button>
      </div>
      <div className="employee-table">
        <table>
          <thead><tr><th>Name</th><th>Email address</th><th>Role</th><th>Teams</th><th>Actions</th></tr></thead>
          <tbody>
            {managers.map(manager => (
              <tr key={manager.id}>
                <td><span className="employee-name"><span className="avatar">{manager.name.slice(0, 1).toUpperCase()}</span>{manager.name}</span></td>
                <td>{manager.email}</td>
                <td><span className="badge manager">Manager</span></td>
                <td>
                  <div className="team-tags">
                    {teams.filter(team => team.manager_id === manager.id).map(team => <span className="badge team-badge" key={team.id}>{team.name}</span>)}
                    {!teams.some(team => team.manager_id === manager.id) && <span className="unassigned">No teams assigned</span>}
                  </div>
                </td>
                <td><button className="primary table-action" onClick={() => navigate('/team')}>Manage teams</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!managers.length && <p className="employee-empty">No managers yet. Select Add manager to create an account.</p>}
      </div>
    </section>
  );
}

function TeamPage({ user, canManage, teams, employees, managers, users, teamLoading, busy, openMapping, assignManager, setTeamName, setError, setNotice, setShowAddTeam }) {
  if (!canManage) return <Navigate to="/" replace />;
  return (
    <section className="teams-page">
      <div className="team-metrics">
        <div><span className="metric-icon"><NavIcon name="team" /></span><div><span>Total teams</span><strong>{teams.length}</strong></div></div>
        <div><span className="metric-icon violet"><NavIcon name="managers" /></span><div><span>Assigned managers</span><strong>{new Set(teams.filter(t => t.manager_id).map(t => t.manager_id)).size}</strong></div></div>
        <div><span className="metric-icon teal"><NavIcon name="employees" /></span><div><span>Team employees</span><strong>{new Set(teams.flatMap(t => t.employee_ids)).size}</strong></div></div>
      </div>
      <div className="teams-heading">
        <div>
          <h2>Directory <span className="count">{teams.length}</span></h2>
          <p>Employees can belong to more than one team.</p>
        </div>
        {user.role === 'superuser' && (
          <button className="primary add-team-trigger" onClick={() => { setTeamName(''); setError(''); setNotice(''); setShowAddTeam(true); }}>
            Add team <span>+</span>
          </button>
        )}
      </div>
      {teamLoading ? (
        <p className="employee-empty" role="status">Loading teams...</p>
      ) : teams.length ? (
        <section className="card team-list-card">
          <div className="employee-table">
            <table>
              <thead>
                <tr>
                  <th>Team name</th>
                  {user.role === 'superuser' && <th>Manager</th>}
                  <th>Employees</th>
                  <th>Members</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr key={team.id}>
                    <td><span className="team-list-name"><span className="icon-box">&#9671;</span>{team.name}</span></td>
                    {user.role === 'superuser' && (
                      <td>
                        <select className="manager-select" aria-label={'Manager for ' + team.name} disabled={busy} value={team.manager_id || ''} onChange={e => assignManager(team.id, e.target.value)}>
                          <option value="">Unassigned</option>
                          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </td>
                    )}
                    <td><span className="count">{team.employee_ids.length}</span></td>
                    <td>
                      <div className="team-list-members">
                        {team.employee_ids.map(id => { const member = employees.find(e => e.id === id); return member ? <span className="team-person" key={id}><span className="avatar">{member.name.slice(0, 1).toUpperCase()}</span>{member.name}</span> : null; })}
                        {!team.employee_ids.length && <span className="unassigned">No employees assigned</span>}
                      </div>
                    </td>
                    <td><button className="primary table-action" disabled={busy} onClick={() => openMapping('team', team)}>Manage employees</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="card employee-empty">
          {user.role === 'manager' ? 'No teams assigned yet. Ask a Super User to assign you as a team manager.' : 'No teams yet. Select Add team to create your first team.'}
        </section>
      )}
    </section>
  );
}

function PayrollPage() {
  return (
    <section className="card role-home">
      <span className="welcome-symbol" aria-hidden="true">&#8377;</span>
      <p>Payroll features will appear here as they are added.</p>
    </section>
  );
}

// ── Main workspace shell ───────────────────────────────────────────────────────

function Workspace({ user, setUser, demoEnabled }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileMenu, setProfileMenu] = useState(null);
  const [account, setAccount] = useState({ ...emptyAccount });
  const [mapping, setMapping] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const headerProfileRef = useRef(null), sidebarProfileRef = useRef(null);

  const canManage = user?.role === 'superuser' || user?.role === 'manager';
  const employees = users.filter(m => m.role === 'employee');
  const managers = users.filter(m => m.role === 'manager');

  // Clear messages on route change
  useEffect(() => { setError(''); setNotice(''); setMapping(null); }, [location.pathname]);

  useEffect(() => {
    function outside(event) {
      if (!headerProfileRef.current?.contains(event.target) && !sidebarProfileRef.current?.contains(event.target)) setProfileMenu(null);
    }
    function escape(event) { if (event.key === 'Escape') setProfileMenu(null); }
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', escape); };
  }, []);

  function profileOptions(location) {
    return profileMenu === location && (
      <div className="profile-options" aria-label="Profile options">
        <button type="button" onClick={() => { setProfileMenu(null); setShowProfile(true); setNotice(''); }}>Edit profile</button>
        <button type="button" className="profile-signout" disabled={busy} onClick={() => { setProfileMenu(null); signOut(); }}>Sign out</button>
      </div>
    );
  }

  async function refreshUsers() {
    try { const result = await api('/api/users'); setUsers(result.users); }
    catch (e) { setError(e.message); if (e.status === 401) setUser(null); }
  }
  async function refreshTeams() {
    setTeamLoading(true);
    try { const result = await api('/api/teams'); setTeams(result.teams); }
    catch (e) { setError(e.message); if (e.status === 401) setUser(null); }
    finally { setTeamLoading(false); }
  }
  useEffect(() => { if (canManage) { refreshUsers(); refreshTeams(); } }, [user?.id]);

  async function createTeam(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { await api('/api/teams', { name: teamName }); setTeamName(''); setShowAddTeam(false); setNotice('Team created. Select Manage employees to assign members.'); await refreshTeams(); }
    catch (e) { setError(e.message); if (e.status === 401) setUser(null); }
    finally { setBusy(false); }
  }
  async function assignManager(teamId, managerId) {
    setBusy(true); setError(''); setNotice('');
    try { await api('/api/teams/manager', { team_id: teamId, manager_id: managerId ? Number(managerId) : null }); await refreshTeams(); setNotice('Team manager updated.'); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function openMapping(kind, item) {
    setError(''); setNotice('');
    setMapping({ kind, id: item.id, name: item.name, ids: kind === 'team' ? [...item.employee_ids] : teams.filter(team => team.employee_ids.includes(item.id)).map(team => team.id) });
  }
  async function saveMapping(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await api(mapping.kind === 'team' ? '/api/teams/members' : '/api/employees/teams', mapping.kind === 'team' ? { team_id: mapping.id, employee_ids: mapping.ids } : { employee_id: mapping.id, team_ids: mapping.ids });
      setMapping(null); setNotice('Team assignments saved.'); await refreshTeams();
    } catch (e) { setError(e.message); if (e.status === 401) setUser(null); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError('');
    try { await api('/api/auth/logout', {}); setUser(null); setUsers([]); setTeams([]); setMapping(null); setNotice(''); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function createAccount(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await api('/api/users', { ...account, role: user.role === 'manager' ? 'employee' : account.role, team_ids: account.role === 'employee' ? account.team_ids : [] });
      setAccount({ ...emptyAccount }); setShowAccount(false);
      setNotice('Account created. They can now sign in with their email and password.');
      await refreshUsers(); await refreshTeams();
    } catch (e) { setError(e.message); if (e.status === 401) setUser(null); } finally { setBusy(false); }
  }

  const alerts = <>{error && <div className="alert error" role="alert">{error}</div>}{notice && <div className="alert success" role="status">{notice}</div>}</>;

  // Page heading derived from route
  const pageHeadings = {
    '/employees': 'Employees', '/managers': 'Managers', '/team': 'Team',
    '/tasks': 'Tasks', '/visits': 'Site Visits', '/attendance': 'Attendance', '/payroll': 'Payroll',
  };
  const heading = pageHeadings[location.pathname] ?? `Welcome, ${user.name}.`;

  const sharedProps = { user, canManage, employees, managers, teams, users, busy, teamLoading, openMapping, setAccount, setError, setNotice, setShowAccount, assignManager, setTeamName, setShowAddTeam };

  return (
    <div className="workspace">
      <header>
        <a className="brand" href="/"><img className="brand-logo" src="/logo.png" alt="Solvitive" /></a>
        <div className="header-profile">
          <span className={'badge ' + user.role}>{roles[user.role]}</span>
          <div className="profile-menu-anchor" ref={headerProfileRef}>
            <button className="profile-trigger" aria-label="Open profile options" aria-expanded={profileMenu === 'header'} aria-controls="header-profile-options" onClick={() => setProfileMenu(profileMenu === 'header' ? null : 'header')}>
              <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="header-name">{user.name}<small>My account</small></span>
              <span aria-hidden="true">&#8964;</span>
            </button>
            <div id="header-profile-options">{profileOptions('header')}</div>
          </div>
        </div>
      </header>

      <div className="workspace-body">
        <aside className="sidebar">
          <span className="sidebar-label">WORKSPACE MENU</span>
          <nav aria-label="Workspace navigation">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} aria-current={location.pathname === '/' ? 'page' : undefined}>
              <NavIcon name="overview" /> Overview
            </NavLink>
            {canManage && (
              <NavLink to="/employees" className={({ isActive }) => isActive ? 'active' : ''} aria-current={location.pathname === '/employees' ? 'page' : undefined} onClick={() => refreshUsers()}>
                <NavIcon name="employees" /> Employees <span className="sidebar-count">{employees.length}</span>
              </NavLink>
            )}
            {user.role === 'superuser' && (
              <NavLink to="/managers" className={({ isActive }) => isActive ? 'active' : ''} aria-current={location.pathname === '/managers' ? 'page' : undefined} onClick={() => { refreshUsers(); refreshTeams(); }}>
                <NavIcon name="managers" /> Managers <span className="sidebar-count">{managers.length}</span>
              </NavLink>
            )}
            {canManage && (
              <NavLink to="/team" className={({ isActive }) => isActive ? 'active' : ''} aria-current={location.pathname === '/team' ? 'page' : undefined} onClick={() => { refreshUsers(); refreshTeams(); }}>
                <NavIcon name="team" /> Team <span className="sidebar-count">{teams.length}</span>
              </NavLink>
            )}
            <NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''} aria-current={location.pathname === '/tasks' ? 'page' : undefined}>
              <NavIcon name="tasks" /> Tasks
            </NavLink>
            {canManage && (
              <NavLink to="/visits" className={({ isActive }) => isActive ? 'active' : ''} aria-current={location.pathname === '/visits' ? 'page' : undefined}>
                <NavIcon name="visits" /> Site Visits
              </NavLink>
            )}
            <NavLink to="/attendance" className={({ isActive }) => isActive ? 'active' : ''} aria-current={location.pathname === '/attendance' ? 'page' : undefined}>
              <NavIcon name="attendance" /> Attendance
            </NavLink>
            <NavLink to="/payroll" className={({ isActive }) => isActive ? 'active' : ''} aria-current={location.pathname === '/payroll' ? 'page' : undefined}>
              <NavIcon name="payroll" /> Payroll
            </NavLink>
          </nav>

          <div className="sidebar-account-anchor" ref={sidebarProfileRef}>
            <button className="sidebar-profile" onClick={() => setProfileMenu(profileMenu === 'sidebar' ? null : 'sidebar')} aria-label="Open your profile options" aria-expanded={profileMenu === 'sidebar'} aria-controls="sidebar-profile-options">
              <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
              <div><strong>{user.name}</strong><small>{roles[user.role]}</small></div>
              <span className="account-chevron" aria-hidden="true">&#8964;</span>
            </button>
            <div id="sidebar-profile-options">{profileOptions('sidebar')}</div>
          </div>
        </aside>

        <main className="dashboard">
          <h1>{heading}</h1>
          <p className="subtitle">You're signed in as {roles[user.role] === 'Employee' ? 'an' : 'a'} {roles[user.role]}.</p>
          {alerts}

          <Routes>
            <Route path="/" element={<OverviewPage {...sharedProps} refreshUsers={refreshUsers} refreshTeams={refreshTeams} />} />
            <Route path="/employees" element={<EmployeesPage {...sharedProps} />} />
            <Route path="/managers" element={<ManagersPage {...sharedProps} navigate={navigate} />} />
            <Route path="/team" element={<TeamPage {...sharedProps} />} />
            <Route path="/tasks" element={<Tasks user={user} api={api} onSessionExpired={() => setUser(null)} />} />
            <Route path="/visits" element={canManage ? <SiteVisits api={api} onSessionExpired={() => setUser(null)} /> : <Navigate to="/" replace />} />
            <Route path="/attendance" element={<Attendance user={user} api={api} onSessionExpired={() => setUser(null)} />} />
            <Route path="/payroll" element={<Payroll user={user} api={api} onSessionExpired={() => setUser(null)} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {showProfile && (
        <Profile user={user} api={api} onClose={() => setShowProfile(false)}
          onSessionExpired={() => { setShowProfile(false); setUser(null); }}
          onSave={updated => { setUser(updated); setShowProfile(false); setNotice('Profile updated.'); if (canManage) refreshUsers(); }} />
      )}

      {showAccount && canManage && (
        <Modal title={user.role === 'manager' ? 'Add employee' : account.role === 'manager' ? 'Add manager' : account.role === 'employee' ? 'Add employee' : 'Add account'} busy={busy} onClose={() => setShowAccount(false)}>
          <p className="subtitle">Give a team member access to your workspace.</p>
          {error && <div className="alert error" role="alert">{error}</div>}
          <form onSubmit={createAccount}>
            <label>Full name<input autoFocus required maxLength={100} autoComplete="off" placeholder="Team member's name" value={account.name} onChange={e => setAccount({ ...account, name: e.target.value })} /></label>
            <label>Email address<input type="email" required maxLength={254} autoComplete="off" placeholder="name@company.com" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} /></label>
            <label>Temporary password<input type="password" required minLength={10} maxLength={256} autoComplete="new-password" placeholder="At least 10 characters" value={account.password} onChange={e => setAccount({ ...account, password: e.target.value })} /></label>
            <label>Role
              <select disabled={user.role === 'manager'} value={user.role === 'manager' ? 'employee' : account.role} onChange={e => setAccount({ ...account, role: e.target.value })}>
                {Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            {account.role === 'employee' && (
              <fieldset className="account-teams">
                <legend>Allocate to teams (optional)</legend>
                {teams.map(team => (
                  <label key={team.id}>
                    <input type="checkbox" checked={account.team_ids.includes(team.id)} onChange={e => setAccount({ ...account, team_ids: e.target.checked ? [...account.team_ids, team.id] : account.team_ids.filter(id => id !== team.id) })} />
                    {team.name}
                  </label>
                ))}
                {!teams.length && <p>{user.role === 'manager' ? 'Ask a Super User to assign you a team. You can create the employee now and allocate them later.' : 'Create a team from Team to allocate employees.'}</p>}
              </fieldset>
            )}
            <div className="task-form-actions">
              <button type="button" className="secondary" disabled={busy} onClick={() => setShowAccount(false)}>Cancel</button>
              <button className="primary" disabled={busy}>{busy ? 'Please wait…' : 'Create account'}<span>＋</span></button>
            </div>
          </form>
        </Modal>
      )}

      {showAddTeam && user.role === 'superuser' && (
        <div className="mapping-overlay" onClick={() => !busy && setShowAddTeam(false)}>
          <section className="card add-team-dialog" role="dialog" aria-modal="true" aria-labelledby="add-team-title"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Escape' && !busy) setShowAddTeam(false);
              if (e.key === 'Tab') { const controls = [...e.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled)')]; if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls.at(-1).focus(); } else if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0].focus(); } }
            }}>
            <h2 id="add-team-title">Add team</h2>
            <p className="subtitle">Create a team. You can assign its manager and employees from the list.</p>
            {error && <div className="alert error" role="alert">{error}</div>}
            <form onSubmit={createTeam}>
              <label>Team name<input autoFocus required maxLength={100} placeholder="e.g. Operations" value={teamName} onChange={e => setTeamName(e.target.value)} /></label>
              <div className="task-form-actions">
                <button type="button" className="secondary" disabled={busy} onClick={() => setShowAddTeam(false)}>Cancel</button>
                <button className="primary" disabled={busy || !teamName.trim()}>{busy ? 'Creating...' : 'Create team'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {mapping && (
        <div className="mapping-overlay" onClick={() => !busy && setMapping(null)}>
          <section className="mapping-dialog card" role="dialog" aria-modal="true" aria-labelledby="mapping-title"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Escape' && !busy) setMapping(null);
              if (e.key === 'Tab') { const controls = [...e.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled)')]; const first = controls[0], last = controls[controls.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
            }}>
            <div className="mapping-title">
              <h2 id="mapping-title">{mapping.kind === 'team' ? 'Manage employees' : 'Assign teams'}</h2>
              <button className="secondary" autoFocus disabled={busy} aria-label="Close assignments" onClick={() => setMapping(null)}>Close</button>
            </div>
            <p className="subtitle">{mapping.name} · {mapping.kind === 'team' ? 'select the employees for this team.' : 'select one or more teams for this employee.'}</p>
            {error && <div className="alert error" role="alert">{error}</div>}
            <form onSubmit={saveMapping}>
              <div className="mapping-options">
                {(mapping.kind === 'team' ? employees : teams).map(item => (
                  <label className="mapping-option" key={item.id}>
                    <input type="checkbox" checked={mapping.ids.includes(item.id)} onChange={e => setMapping({ ...mapping, ids: e.target.checked ? [...mapping.ids, item.id] : mapping.ids.filter(id => id !== item.id) })} />
                    <span><strong>{item.name}</strong>{item.email && <small>{item.email}</small>}</span>
                  </label>
                ))}
                {!(mapping.kind === 'team' ? employees : teams).length && <p className="employee-empty">{mapping.kind === 'team' ? 'Add employees from Overview first.' : 'Create a team from Team first.'}</p>}
              </div>
              <p className="mapping-hint">{mapping.ids.length} selected. Clear all selections to remove these assignments.</p>
              <button className="primary" disabled={busy}>{busy ? 'Saving...' : 'Save assignments'}<span>&#10003;</span></button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

// ── Auth screens ───────────────────────────────────────────────────────────────

function AuthScreen({ onSignIn, demoEnabled }) {
  const [setup, setSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [login, setLogin] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    api('/api/auth/status').then(result => { setSetup(result.needs_setup); if (result.user) onSignIn(result.user, result.demo_enabled); })
      .catch(() => setError('Cannot connect to the server. Start the Python backend and reload.'))
      .finally(() => setLoading(false));
  }, []);

  async function signIn(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api(setup ? '/api/auth/setup' : '/api/auth/login', login);
      onSignIn(result.user, demoEnabled);
      setLogin({ name: '', email: '', password: '' });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function demoSignIn(role) {
    setBusy(true); setError('');
    try {
      const result = await api('/api/auth/login', { email: `${role}@demo.local`, password: 'Demo@12345' });
      onSignIn(result.user, demoEnabled);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (loading) return <div className="loading">Opening your workspace…</div>;

  return (
    <main className="auth-layout">
      <section className="intro">
        <a className="brand" href="/"><img className="brand-logo" src="/logo.png" alt="Solvitive" /></a>
        <div className="intro-copy">
          <span className="eyebrow">ONE WORKSPACE. THE RIGHT ACCESS.</span>
          <h1>Everyone has<br />a place here.</h1>
          <p>A shared space for your team.<br />Access that fits your role.</p>
          <div className="role-list">
            {Object.entries(roles).map(([key, label], i) => (
              <div key={key}>
                <span className="role-symbol">{['✦', '◇', '○'][i]}</span>
                <div>
                  <strong>{label}</strong>
                  <small>{['Manage accounts and workspace access', 'Sign in to your manager workspace', 'Sign in to your employee workspace'][i]}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
        <small className="intro-footer">A clear start for every member of your team.</small>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="lock-mark">↗</div>
          <span className="eyebrow">{setup ? 'LET\'S GET STARTED' : 'WELCOME BACK'}</span>
          <h2>{setup ? 'Set up your workspace' : 'Sign in to your account'}</h2>
          <p className="subtitle">{setup ? 'Create the first Super User account to manage your team.' : 'Enter your details. We\'ll take you to your workspace.'}</p>
          {error && <div className="alert error" role="alert">{error}</div>}
          <form onSubmit={signIn}>
            {setup && <label>Full name<input autoComplete="name" required maxLength={100} value={login.name} onChange={e => setLogin({ ...login, name: e.target.value })} placeholder="Your full name" /></label>}
            <label>Email address<input type="email" autoComplete="username" required maxLength={254} value={login.email} onChange={e => setLogin({ ...login, email: e.target.value })} placeholder="you@company.com" /></label>
            <label>Password
              <div className="password-field">
                <input type={showPassword ? 'text' : 'password'} autoComplete={setup ? 'new-password' : 'current-password'} required minLength={setup ? 10 : 1} maxLength={256} value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} placeholder={setup ? 'At least 10 characters' : 'Enter your password'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </label>
            <button className="primary" disabled={busy}>{busy ? 'Please wait…' : setup ? 'Create Super User account' : 'Sign in'}<span>→</span></button>
          </form>
          {demoEnabled && (
            <section className="demo-login" aria-label="Demo login">
              <h3>Try a demo account</h3>
              <p>Explore the workspace with any role.</p>
              <div className="demo-buttons">
                {Object.entries(roles).map(([role, label]) => <button type="button" key={role} disabled={busy} onClick={() => demoSignIn(role)}>{label}<span>?</span></button>)}
              </div>
              <small>Demo password: <code>Demo@12345</code> · Shared local accounts</small>
            </section>
          )}
          <p className="auth-note">{setup ? 'This setup is available only until the first account is created.' : 'Need an account? Contact your Super User.'}</p>
          <div className="security-note"><span>◈</span> Your role determines your access.</div>
        </div>
        <small className="panel-footer">SUPER USER · MANAGER · EMPLOYEE</small>
      </section>
    </main>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState(null);
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api('/api/auth/status')
      .then(result => { setUser(result.user); setDemoEnabled(result.demo_enabled); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <div className="loading">Opening your workspace…</div>;

  if (!user) return (
    <AuthScreen
      demoEnabled={demoEnabled}
      onSignIn={(u, demo) => { setUser(u); if (demo !== undefined) setDemoEnabled(demo); }}
    />
  );

  return (
    <Routes>
      <Route path="/*" element={<Workspace user={user} setUser={setUser} demoEnabled={demoEnabled} />} />
    </Routes>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
