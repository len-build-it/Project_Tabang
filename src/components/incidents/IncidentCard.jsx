import { Link } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { Badge } from "../ui/Primitives.jsx";
import {
  INCIDENT_BADGE,
  VERIFICATION_BADGE,
  describeReportDetail,
  kindBadge,
} from "../reports/reportBadges.js";
import { STATUS_LABEL } from "./statusLabels.js";

export default function IncidentCard({ incident, onClaim, claiming }) {
  const kind = kindBadge(incident.kind);
  const status = INCIDENT_BADGE[incident.incidentStatus];
  const verification = VERIFICATION_BADGE[incident.verificationStatus];
  const detail = describeReportDetail(incident);

  return (
    // The coloured edge groups kinds at a glance; the badge says it in words.
    <li className={`report-card incident-card incident-card--${incident.kind}`}>
      <div className="report-card__top">
        <Badge icon={kind.icon} srPrefix="Kind: " tone={kind.tone}>
          {kind.label}
        </Badge>
        {incident.waitingFor ? (
          <span className="incident-card__age">
            <Icon name="clock" />
            <span className="visually-hidden">Waiting </span>
            {incident.waitingFor}
          </span>
        ) : null}
      </div>

      <div>
        <h3 className="report-card__title">{incident.publicLocationLabel}</h3>
        {detail ? <p className="report-card__detail">{detail}</p> : null}
      </div>

      <p className="report-card__body">{incident.description}</p>

      <div className="report-card__meta">
        <Badge
          icon={status?.icon ?? "info"}
          srPrefix="Status: "
          tone={status?.tone ?? "neutral"}
        >
          {STATUS_LABEL[incident.incidentStatus] ?? incident.incidentStatus}
        </Badge>
        <Badge
          icon={verification?.icon ?? "help"}
          srPrefix="Verification: "
          tone={verification?.tone ?? "neutral"}
        >
          {verification?.label ?? incident.verificationStatus}
        </Badge>
        {incident.isOverdue ? (
          <Badge icon="alert" tone="danger">
            Overdue
          </Badge>
        ) : null}
      </div>

      <p className="report-card__detail">
        {incident.isClaimed ? "Claimed" : "Not claimed"}
      </p>

      <div className="report-card__actions">
        <Link
          className="action-button action-button--secondary"
          to={`/responder/incidents/${incident.id}`}
        >
          Open incident
        </Link>

        {/* Claiming is only offered while nobody holds it. The transaction is
            what actually prevents a race; this just avoids inviting one. */}
        {!incident.isClaimed && onClaim ? (
          <button
            className="action-button"
            disabled={claiming}
            onClick={() => onClaim(incident)}
            type="button"
          >
            {claiming ? "Claiming…" : "Claim"}
          </button>
        ) : null}
      </div>
    </li>
  );
}
