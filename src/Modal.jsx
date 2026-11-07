import React, { useEffect, useRef } from 'react';

export default function Modal({ title, busy = false, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={ref} className="action-dialog" aria-label={title} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }} onClick={e => { if (e.target === e.currentTarget && !busy) { const bounds = e.currentTarget.getBoundingClientRect(); if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) onClose(); } }}><div className="action-dialog-heading"><h2>{title}</h2><button type="button" className="secondary" aria-label="Close dialog" disabled={busy} onClick={onClose}>Close</button></div>{children}</dialog>;
}
