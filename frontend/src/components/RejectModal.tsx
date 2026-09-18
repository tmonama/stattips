import { useRef } from "react";
import { useModalA11y } from "../hooks/useModalA11y";

export default function RejectModal({ busy, reason, setReason, onCancel, onConfirm }: {
  busy: boolean; reason: string; setReason: (v: string) => void; onCancel: () => void; onConfirm: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useModalA11y(ref, onCancel);
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" ref={ref} role="dialog" aria-modal="true" aria-labelledby="reject-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="reject-title">Reject enquiry</h3>
        <p className="modal-sub">This reason is recorded in the audit trail and sent to the enquirer. Be clear and professional.</p>
        <label className="sr-only" htmlFor="reject-reason">Reason for rejection</label>
        <textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. This enquiry falls outside published Stats SA data; please contact the media desk directly." />
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-reject-solid" disabled={busy || !reason.trim()} onClick={onConfirm}>
            {busy ? "Rejecting…" : "Confirm rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}