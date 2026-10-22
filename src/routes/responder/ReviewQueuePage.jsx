import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EmptyState from "../../components/feedback/EmptyState.jsx";
import ErrorState from "../../components/feedback/ErrorState.jsx";
import Modal from "../../components/feedback/Modal.jsx";
import { FormStatus } from "../../components/forms/FormField.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { Badge, Skeleton } from "../../components/ui/Primitives.jsx";
import { describeActionError } from "../../services/errors/describeActionError.js";
import { createReviewRepository } from "../../services/responders/reviewRepository.js";

function formatWhen(millis) {
  return millis ? new Date(millis).toLocaleString() : "Time not recorded";
}

export default function ReviewQueuePage({ reviewRepository }) {
  const repository = useMemo(
    () => reviewRepository ?? createReviewRepository(),
    [reviewRepository],
  );

  const [applications, setApplications] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [pendingDecision, setPendingDecision] = useState(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState(null);
  const [evidenceLinks, setEvidenceLinks] = useState({});
  const activeRef = useRef(0);

  const load = useCallback(
    async (requestId) => {
      try {
        const items = await repository.listPendingApplications();

        if (activeRef.current !== requestId) {
          return;
        }

        setApplications(items);
        setLoadState("ready");
      } catch {
        if (activeRef.current === requestId) {
          setLoadState("error");
        }
      }
    },
    [repository],
  );

  useEffect(() => {
    activeRef.current += 1;
    load(activeRef.current);

    return () => {
      activeRef.current += 1;
    };
  }, [load]);

  const retry = useCallback(() => {
    activeRef.current += 1;
    setLoadState("loading");
    load(activeRef.current);
  }, [load]);

  // Fetches a link that expires in minutes; the reviewer opens it from the
  // card, so no pop-up blocker or lost tab is involved.
  async function fetchEvidenceLink(path) {
    setStatus(null);

    try {
      const url = await repository.getEvidenceUrl(path);

      setEvidenceLinks((current) => ({ ...current, [path]: url }));
    } catch (error) {
      setStatus({ tone: "error", message: describeActionError(error) });
    }
  }

  async function confirmDecision() {
    const decision = pendingDecision;

    setPendingDecision(null);
    setStatus(null);

    if (!decision) {
      return;
    }

    try {
      const { evidenceDeleted } = await repository.decide({
        application: decision.application,
        approve: decision.approve,
        notes,
      });

      setApplications((current) =>
        current.filter((item) => item.id !== decision.application.id),
      );
      setNotes("");
      setStatus(
        evidenceDeleted
          ? {
              tone: "success",
              message: `Decision recorded for ${decision.application.applicantName || "the applicant"}. Their identity documents were deleted.`,
            }
          : {
              tone: "warning",
              message: `Decision recorded for ${decision.application.applicantName || "the applicant"}, but evidence deletion is pending: the identity documents could not be deleted. Ask an administrator to remove them.`,
            },
      );
    } catch (error) {
      setStatus({
        tone: "error",
        message: `The decision could not be recorded. Nothing was changed. ${describeActionError(error)}`,
      });
    }
  }

  const pendingName =
    pendingDecision?.application.applicantName || "this applicant";

  return (
    <div className="page-stack">
      <p className="page-intro">
        Approving grants responder access immediately. Identity documents are
        deleted once you record a decision.
      </p>

      {loadState === "ready" ? (
        <p className="report-group__note" role="status">
          {applications.length} waiting for review
        </p>
      ) : null}

      <FormStatus message={status?.message} tone={status?.tone} />

      {loadState === "loading" ? (
        <Skeleton label="Loading applications" lines={4} />
      ) : null}

      {loadState === "error" ? (
        <ErrorState
          title="Applications could not be loaded"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={retry}
        />
      ) : null}

      {loadState === "ready" && applications.length === 0 ? (
        <EmptyState
          icon="checkCircle"
          title="No applications waiting"
          message="New responder applications appear here as soon as they are submitted."
        />
      ) : null}

      {loadState === "ready" && applications.length > 0 ? (
        <ul className="report-list report-list--wide">
          {applications.map((application) => {
            const name = application.applicantName || "Name not provided";

            return (
              <li className="report-card" key={application.id}>
                <div className="report-card__top">
                  <Badge icon="clock" srPrefix="Application: " tone="warning">
                    Pending review
                  </Badge>
                  <p className="report-card__time">
                    Applied {formatWhen(application.submittedAtMillis)}
                  </p>
                </div>

                <div>
                  <h2 className="report-card__title">{name}</h2>
                  <p className="report-card__detail">
                    {application.applicantEmail || "Email not provided"}
                  </p>
                </div>

                <dl className="fact-list fact-list--compact">
                  <div>
                    <dt>Organization</dt>
                    <dd>{application.organization}</dd>
                  </div>
                  <div>
                    <dt>Badge number</dt>
                    <dd>{application.badgeNumber}</dd>
                  </div>
                  <div>
                    <dt>Municipality</dt>
                    <dd>{application.municipality}</dd>
                  </div>
                  <div>
                    <dt>Consent version</dt>
                    <dd>{application.consentVersion}</dd>
                  </div>
                </dl>

                {/* Evidence is opened on purpose, never shown in the list. */}
                <div className="button-pair">
                  {[
                    ["ID", "idcard", application.identityDocumentPath],
                    ["selfie", "user", application.selfiePath],
                  ]
                    .filter(([, , path]) => path)
                    .map(([label, icon, path]) =>
                      evidenceLinks[path] ? (
                        <a
                          className="action-button action-button--secondary"
                          href={evidenceLinks[path]}
                          key={path}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <Icon name="ext" />
                          Open the {label} (new tab, link expires in 5 minutes)
                        </a>
                      ) : (
                        <button
                          className="action-button action-button--secondary"
                          key={path}
                          onClick={() => fetchEvidenceLink(path)}
                          type="button"
                        >
                          <Icon name={icon} />
                          View {label}
                        </button>
                      ),
                    )}
                </div>

                <div className="button-pair">
                  <button
                    aria-label={`Approve ${name}`}
                    className="action-button"
                    onClick={() =>
                      setPendingDecision({ application, approve: true })
                    }
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    aria-label={`Reject ${name}`}
                    className="action-button action-button--danger-outline"
                    onClick={() =>
                      setPendingDecision({ application, approve: false })
                    }
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <Modal
        confirmLabel={
          pendingDecision?.approve
            ? "Approve and grant access"
            : "Reject the application"
        }
        confirmTone={pendingDecision?.approve ? "primary" : "danger"}
        description={
          pendingDecision?.approve
            ? "This grants responder access immediately and deletes the identity documents. Only the decision, your notes, your account, and the timestamp are kept."
            : "This records a rejection and deletes the identity documents. The applicant sees your notes and may apply again."
        }
        onClose={() => setPendingDecision(null)}
        onConfirm={confirmDecision}
        open={Boolean(pendingDecision)}
        title={
          pendingDecision?.approve
            ? `Approve ${pendingName}?`
            : `Reject ${pendingName}?`
        }
      >
        <div className="form-field">
          <label className="form-field__label" htmlFor="review-notes">
            {pendingDecision?.approve
              ? "Notes for the record (optional)"
              : "Notes for the applicant (optional)"}
          </label>
          {pendingDecision?.approve ? null : (
            <p className="form-field__hint">
              They will see this with &ldquo;Apply again&rdquo;.
            </p>
          )}
          <textarea
            className="form-field__input"
            id="review-notes"
            maxLength={1000}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            value={notes}
          />
        </div>
      </Modal>
    </div>
  );
}
