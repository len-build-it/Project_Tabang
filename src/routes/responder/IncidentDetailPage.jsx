import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../app/providers/useAuth.js";
import EmptyState from "../../components/feedback/EmptyState.jsx";
import ErrorState from "../../components/feedback/ErrorState.jsx";
import Modal from "../../components/feedback/Modal.jsx";
import { FormStatus } from "../../components/forms/FormField.jsx";
import {
  INCIDENT_BADGE,
  VERIFICATION_BADGE,
  describeReportDetail,
  kindBadge,
} from "../../components/reports/reportBadges.js";
import Icon from "../../components/ui/Icon.jsx";
import { Badge, Skeleton } from "../../components/ui/Primitives.jsx";
import { describeActionError } from "../../services/errors/describeActionError.js";
import {
  INCIDENT_STATUS,
  ROLE_LABELS,
  STATUS_LABELS,
  VERIFICATION_LABELS,
  allowedNextStatuses,
} from "../../services/incidents/incidentLifecycle.js";
import { createIncidentRepository } from "../../services/incidents/incidentRepository.js";
import {
  NEED_LABELS,
  SEVERITY_LABELS,
} from "../../services/reports/reportSchemas.js";

function formatWhen(millis) {
  return millis ? new Date(millis).toLocaleString() : "Time not recorded";
}

function mapLink({ latitude, longitude }) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function actionLabel(fromStatus, toStatus) {
  return fromStatus === INCIDENT_STATUS.new &&
    toStatus === INCIDENT_STATUS.acknowledged
    ? "Acknowledge and claim"
    : `Mark ${STATUS_LABELS[toStatus]?.toLowerCase() ?? toStatus}`;
}

function describeEvent(event) {
  const labels =
    event.type === "verification" ? VERIFICATION_LABELS : STATUS_LABELS;
  const change = `${labels[event.fromStatus] ?? event.fromStatus ?? "Start"} to ${labels[event.toStatus] ?? event.toStatus}`;

  return event.type === "verification" ? `Verification: ${change}` : change;
}

export default function IncidentDetailPage({ incidentRepository }) {
  const { id } = useParams();
  const { isReviewer, user } = useAuth();
  const repository = useMemo(
    () => incidentRepository ?? createIncidentRepository(),
    [incidentRepository],
  );

  const [incident, setIncident] = useState(null);
  const [events, setEvents] = useState([]);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const [loadState, setLoadState] = useState("loading");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState(null);
  const [working, setWorking] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(null);
  const activeRef = useRef(0);

  const load = useCallback(
    async (requestId) => {
      try {
        const [found, trail] = await Promise.all([
          repository.getIncident(id),
          repository.listEvents(id),
        ]);

        if (activeRef.current !== requestId) {
          return;
        }

        setIncident(found);
        setEvents(trail);
        setLoadState(found ? "ready" : "missing");

        if (found?.imagePaths?.length > 0) {
          const urls = await repository.getPhotoUrls(found.imagePaths);

          if (activeRef.current === requestId) {
            setPhotoUrls(urls);
          }
        }
      } catch {
        if (activeRef.current === requestId) {
          setLoadState("error");
        }
      }
    },
    [repository, id],
  );

  useEffect(() => {
    activeRef.current += 1;
    load(activeRef.current);

    return () => {
      activeRef.current += 1;
    };
  }, [load]);

  const refresh = useCallback(() => {
    activeRef.current += 1;
    setLoadState("loading");
    load(activeRef.current);
  }, [load]);

  async function advance(toStatus) {
    setWorking(true);
    setActionError(null);

    try {
      await repository.transitionIncident({ incidentId: id, toStatus, note });
      setNote("");
      refresh();
    } catch (error) {
      setActionError(describeActionError(error));
      refresh();
    } finally {
      setWorking(false);
    }
  }

  async function verify(verificationStatus) {
    setPendingVerification(null);
    setWorking(true);
    setActionError(null);

    try {
      await repository.verifyIncident({ incidentId: id, verificationStatus });
      refresh();
    } catch (error) {
      setActionError(describeActionError(error));
    } finally {
      setWorking(false);
    }
  }

  if (loadState === "loading") {
    return <Skeleton label="Loading the incident" lines={6} />;
  }

  if (loadState === "error") {
    return (
      <ErrorState
        title="The incident could not be loaded"
        message="Check your connection and try again."
        actionLabel="Try again"
        onAction={refresh}
      />
    );
  }

  if (loadState === "missing") {
    return (
      <EmptyState
        title="That incident is not available"
        message="It may have been removed, or you may have followed an out-of-date link."
      />
    );
  }

  const nextStatuses = allowedNextStatuses(incident.incidentStatus);
  // The database is the boundary; this only avoids offering a refused action.
  const canAct =
    isReviewer || incident.assignedResponderIds.includes(user?.uid);
  const kind = kindBadge(incident.kind);
  const status = INCIDENT_BADGE[incident.incidentStatus];
  const verification = VERIFICATION_BADGE[incident.verificationStatus];
  // The headline is the need and the place, never an id number.
  const headline = [describeReportDetail(incident), incident.publicLocationLabel]
    .filter(Boolean)
    .join(" · ");
  const rejecting = pendingVerification === "rejected";

  return (
    <div className="page-stack incident-detail">
      <div className="incident-detail__head">
        <div className="report-card__meta">
          <Badge icon={kind.icon} srPrefix="Kind: " tone={kind.tone}>
            {kind.label}
          </Badge>
          <Badge
            icon={status?.icon ?? "info"}
            srPrefix="Status: "
            tone={status?.tone ?? "neutral"}
          >
            {STATUS_LABELS[incident.incidentStatus] ?? incident.incidentStatus}
          </Badge>
          <Badge
            icon={verification?.icon ?? "help"}
            srPrefix="Verification: "
            tone={verification?.tone ?? "neutral"}
          >
            {VERIFICATION_LABELS[incident.verificationStatus] ??
              incident.verificationStatus}
          </Badge>
          {incident.isOverdue ? (
            <Badge icon="alert" tone="danger">
              Overdue
            </Badge>
          ) : null}
        </div>
        <h2 className="incident-detail__headline">{headline}</h2>
        <p className="page-intro">
          Contact details and the exact location are shown because you are
          handling this incident. They are not public.
        </p>
      </div>

      <div className="incident-detail__columns">
        <div className="page-stack">
          <section aria-label="Place and contact" className="contact-panel">
            <div className="contact-panel__place">
              <Icon name="pin" />
              <div>
                <strong>{incident.publicLocationLabel}</strong>
                {incident.landmark ? (
                  <p>Landmark: {incident.landmark}</p>
                ) : null}
                {incident.preciseLocation ? (
                  <a
                    className="text-link text-link--start"
                    href={mapLink(incident.preciseLocation)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open in Google Maps
                    <Icon name="ext" />
                  </a>
                ) : null}
              </div>
            </div>
            {incident.contactPhone ? (
              <a
                className="contact-panel__call"
                href={`tel:${encodeURIComponent(incident.contactPhone)}`}
              >
                <Icon name="phone" />
                <span className="contact-panel__call-text">
                  <strong>{incident.contactPhone}</strong>
                  <span>Reporter · tap to call</span>
                </span>
                <Icon name="chevR" />
              </a>
            ) : null}
          </section>

          <dl className="fact-list">
            <div>
              <dt>Reported</dt>
              <dd>{formatWhen(incident.createdAtMillis)}</dd>
            </div>
            <div>
              <dt>Acknowledged</dt>
              <dd>{formatWhen(incident.acknowledgedAtMillis)}</dd>
            </div>
            {incident.severity ? (
              <div>
                <dt>Water depth</dt>
                <dd>{SEVERITY_LABELS[incident.severity] ?? incident.severity}</dd>
              </div>
            ) : null}
            {incident.need ? (
              <div>
                <dt>Needs</dt>
                <dd>
                  {NEED_LABELS[incident.need] ?? incident.need}
                  {incident.peopleAffected
                    ? ` (${incident.peopleAffected} people)`
                    : ""}
                </dd>
              </div>
            ) : null}
          </dl>

          <section aria-labelledby="incident-description">
            <h2 className="section-title" id="incident-description">
              Description
            </h2>
            <p className="report-card__body">{incident.description}</p>
          </section>

          {photoUrls.length > 0 ? (
            <section aria-labelledby="incident-photos">
              <h2 className="section-title" id="incident-photos">
                Photos · {photoUrls.length}
              </h2>
              <ul className="photo-grid">
                {photoUrls.map((url, index) =>
                  url && !failedImages.has(url) ? (
                    <li key={url}>
                      <a href={url} rel="noopener noreferrer" target="_blank">
                        <img
                          alt={`Photo ${index + 1} sent with the report`}
                          onError={() =>
                            setFailedImages((current) =>
                              new Set(current).add(url),
                            )
                          }
                          src={url}
                        />
                      </a>
                    </li>
                  ) : (
                    <li className="photo-missing" key={`missing-${index}`}>
                      <Icon name="image" />
                      Photo unavailable
                    </li>
                  ),
                )}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="page-stack">
          <section aria-labelledby="update-heading" className="action-panel">
            <h2 className="section-title" id="update-heading">
              Record an update
            </h2>
            <FormStatus message={actionError} />

            {nextStatuses.length === 0 ? (
              <p>
                This incident is closed. Its history is kept and cannot be
                changed.
              </p>
            ) : (
              <>
                <div className="form-field">
                  <label className="form-field__label" htmlFor="incident-note">
                    Note (optional)
                  </label>
                  <textarea
                    className="form-field__input"
                    id="incident-note"
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    value={note}
                  />
                </div>

                {/* The usual next step is the main button; skipping ahead
                    stays possible but is visibly secondary. */}
                {nextStatuses.map((next, index) => (
                  <button
                    className={
                      index === 0
                        ? "action-button action-button--block"
                        : "action-button action-button--secondary action-button--block"
                    }
                    disabled={working}
                    key={next}
                    onClick={() => advance(next)}
                    type="button"
                  >
                    {actionLabel(incident.incidentStatus, next)}
                  </button>
                ))}
              </>
            )}

            {canAct && incident.incidentStatus !== INCIDENT_STATUS.new ? (
              <div className="button-pair">
                <button
                  className="action-button action-button--secondary"
                  disabled={
                    working || incident.verificationStatus === "verified"
                  }
                  onClick={() => setPendingVerification("verified")}
                  type="button"
                >
                  <Icon name="shield" />
                  Verify
                </button>
                <button
                  className="action-button action-button--danger-outline"
                  disabled={
                    working || incident.verificationStatus === "rejected"
                  }
                  onClick={() => setPendingVerification("rejected")}
                  type="button"
                >
                  <Icon name="shieldX" />
                  Reject
                </button>
              </div>
            ) : null}
          </section>

          <section aria-labelledby="history-heading" className="action-panel">
            <h2 className="section-title" id="history-heading">
              Response history
            </h2>
            {events.length === 0 ? (
              <p>
                No entries yet. Claiming or updating this incident records an
                entry here.
              </p>
            ) : (
              <ol className="timeline">
                {events.map((event) => (
                  <li key={event.id}>
                    <strong>{describeEvent(event)}</strong>
                    <span className="timeline__meta">
                      {ROLE_LABELS[event.actorRole] ?? event.actorRole} ·{" "}
                      {formatWhen(event.createdAtMillis)}
                    </span>
                    {event.note ? <p>{event.note}</p> : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      {/* Verifying or rejecting changes what the reporter sees, so both ask
          first; the safe choice takes the focus. */}
      <Modal
        confirmLabel={rejecting ? "Yes, reject" : "Yes, verify"}
        confirmTone={rejecting ? "danger" : "primary"}
        description={
          rejecting
            ? "The reporter will see “Could not be verified” on this report. Other responders will see it in the queue."
            : "The reporter will see “Verified” on this report. Other responders will see it in the queue."
        }
        onClose={() => setPendingVerification(null)}
        onConfirm={() => verify(pendingVerification)}
        open={Boolean(pendingVerification)}
        title={
          rejecting ? "Mark as could not be verified?" : "Mark as verified?"
        }
      />
    </div>
  );
}
