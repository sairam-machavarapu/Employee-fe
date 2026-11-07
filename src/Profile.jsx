import React, { useState } from 'react';
import Modal from './Modal';

export default function Profile({ user, api, onSave, onClose, onSessionExpired }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, current_password: '', new_password: '', confirm_password: '' });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const field = key => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });
  const changingCredentials = form.email.trim().toLowerCase() !== user.email || !!form.new_password;
  async function save(e) {
    e.preventDefault(); setError('');
    if (form.new_password !== form.confirm_password) { setError('New passwords do not match.'); return; }
    setBusy(true);
    try { const result = await api('/api/profile', form); onSave(result.user); }
    catch (e) { setError(e.message); if (e.status === 401) onSessionExpired(); }
    finally { setBusy(false); }
  }
  return <Modal title="Edit profile" busy={busy} onClose={onClose}><p className="subtitle">Update your details. Your account role stays the same.</p>{error && <div className="alert error" role="alert">{error}</div>}<form onSubmit={save}><label>Full name<input autoFocus required maxLength={100} autoComplete="name" {...field('name')} /></label><label>Email address<input type="email" required maxLength={254} autoComplete="username" {...field('email')} /></label><label>Current password<input type="password" required={changingCredentials} maxLength={256} autoComplete="current-password" placeholder="Required to change email or password" {...field('current_password')} /></label><label>New password (optional)<input type="password" minLength={10} maxLength={256} autoComplete="new-password" placeholder="Leave blank to keep your password" {...field('new_password')} /></label><label>Confirm new password<input type="password" required={!!form.new_password} maxLength={256} autoComplete="new-password" {...field('confirm_password')} /></label><div className="task-form-actions"><button className="secondary" type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</button></div></form></Modal>;
}
