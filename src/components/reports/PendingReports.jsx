import { useState } from "react";
import Modal from "../feedback/Modal.jsx";
import { FormStatus } from "../forms/FormField.jsx";
import Icon from "../ui/Icon.jsx";
import { Badge } from "../ui/Primitives.jsx";
import { describeActionError } from "../../services/errors/describeActionError.js";
import {
  SUBMISSION_STATE,
  SUBMISSION_STATE_COPY,
} from "../../services/offline/submissionQueue.js";
import { describeReportDetail, kindBadge } from "./reportBadges.js";
import usePendingReports from "./usePendingReports.js";

function describeSaved(entry) {
  const parts = [describeReportDetail({ kind: entry.kind, ...entry.values })];

  if (entry.queuedAtMillis) {
    parts.push(`saved ${new Date(entry.queuedAtMillis).toLocaleString()}`);
  }

  parts.push("not sent yet");

  if (entry.attempts) {
    parts.push(
      `${entry.attempts} failed attempt${entry.attempts === 1 ? "" : "s"}`,
    );
  }

  return parts.filter(Boolean).join(" · ");
}

/**
 * Reports saved on this phone that the database has not accepted yet.
 *
 * Each can be sent now or discarded. Photos are not kept on the phone, so a
 * resend carries the words only. Nothing here says "sent" until the database
 * has accepted the report.
 */
export default function PendingReports({ queue, repository }) {
  const entries = usePendingReports(queue);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [pendingDiscard, setPendingDiscard] = useState(null);

  if (entries.length === 0) {
    return null;
  }

  async function sendNow(entry) {
    setBusyId(entry.reportId);
    setError(null);

    try {
      await repository.submitReport({
        reportId: entry.reportId,
        values: entry.values,
        images: [],
      });
      queue.remove(entry.reportId);
    } catch (sendError) {
      queue.recordFailure(entry.reportId, "unknown");
      setError(describeActionError(sendError));
    } finally {
      setBusyId(null);
    }
  }

  function confirmDiscard() {
    const target = pendingDiscard;

    setPendingDiscard(null);

    if (target) {
      queue.discard(target.reportId);
    }
  }

  return (
    <section aria-labelledby="pending-reports-title" className="report-group">
      <h2 className="report-group__title" id="pending-reports-title">
        <Icon name="device" />
        Saved on this phone · {entries.length}
      </h2>
      <p className="report-group__note">
        {SUBMISSION_STATE_COPY[SUBMISSION_STATE.savedLocally]} Photos are not
        resent.
      </p>

      <FormStatus message={error} />

      <ul className="report-list">
        {entries.map((entry) => {
          const kind = kindBadge(entry.kind);
          const place =
            entry.values?.publicLocationLabel || "Location not recorded";

          return (
            <li
              className="report-card report-card--pending"
              key={entry.reportId}
            >
              <div className="report-card__meta">
                <Badge icon={kind.icon} srPrefix="Kind: " tone={kind.tone}>
                  {kind.label}
                </Badge>
                <Badge icon="device" tone="warning">
                  Saved on this phone
                </Badge>
              </div>
              <div>
                <h3 className="report-card__title">{place}</h3>
                <p className="report-card__detail">{describeSaved(entry)}</p>
              </div>
              <div className="report-card__actions">
                <button
                  className="action-button"
                  disabled={busyId !== null}
                  onClick={() => sendNow(entry)}
                  type="button"
                >
                  <Icon name="send" />
                  {busyId === entry.reportId ? "Sending…" : "Send now"}
                </button>
                <button
                  className="action-button action-button--danger-outline"
                  disabled={busyId !== null}
                  onClick={() => setPendingDiscard(entry)}
                  type="button"
                >
                  Discard
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal
        confirmLabel="Yes, discard report"
        confirmTone="danger"
        description={`${kindBadge(pendingDiscard?.kind).label} at ${
          pendingDiscard?.values?.publicLocationLabel || "an unrecorded place"
        }. It has not been sent, so nobody has seen it. Discarding deletes it from this phone and cannot be undone.`}
        dismissLabel="Keep report"
        onClose={() => setPendingDiscard(null)}
        onConfirm={confirmDiscard}
        open={Boolean(pendingDiscard)}
        title="Discard this report?"
      />
    </section>
  );
}
