import { Badge } from "../ui/Primitives.jsx";
import {
  INCIDENT_BADGE,
  VERIFICATION_BADGE,
  describeReportDetail,
  kindBadge,
} from "./reportBadges.js";

function formatWhen(millis) {
  return millis ? new Date(millis).toLocaleString() : "Time not recorded";
}

/**
 * One card, two variants.
 *
 * The `public` variant renders only fields that are safe for anyone to see. It
 * deliberately has no branch that can display a description, a phone number, or
 * coordinates, so a caller cannot pass protected data into the public feed by
 * mistake.
 */
export default function ReportCard({ report, variant = "personal", onCancel }) {
  const isPersonal = variant === "personal";
  // Staleness is computed at fetch time so this component stays pure.
  const isStale = Boolean(report.isStale);
  const kind = kindBadge(report.kind);
  const incident = INCIDENT_BADGE[report.incidentStatus];
  const verification = VERIFICATION_BADGE[report.verificationStatus];
  const detail = isPersonal ? describeReportDetail(report) : "";

  return (
    <li className="report-card">
      <div className="report-card__top">
        <Badge icon={kind.icon} srPrefix="Kind: " tone={kind.tone}>
          {kind.label}
        </Badge>
        <p className="report-card__time">
          {formatWhen(report.createdAtMillis)}
        </p>
      </div>

      <div>
        <h3 className="report-card__title">
          {isPersonal ? report.publicLocationLabel : report.barangay}
        </h3>
        {detail ? <p className="report-card__detail">{detail}</p> : null}
      </div>

      <p className="report-card__body">
        {isPersonal ? report.description : report.summary}
      </p>

      <div className="report-card__meta">
        {isPersonal ? (
          <>
            <Badge
              icon={incident?.icon ?? "info"}
              srPrefix="Status: "
              tone={incident?.tone ?? "neutral"}
            >
              {incident?.label ?? report.incidentStatus}
            </Badge>
            <Badge
              icon={verification?.icon ?? "help"}
              srPrefix="Verification: "
              tone={verification?.tone ?? "neutral"}
            >
              {verification?.label ?? report.verificationStatus}
            </Badge>
          </>
        ) : (
          <Badge icon="shield" srPrefix="Verification: " tone="success">
            Verified
          </Badge>
        )}

        {isStale ? (
          <Badge icon="clock" tone="warning">
            No update in 24h
          </Badge>
        ) : null}
      </div>

      {isPersonal && onCancel && report.canCancel ? (
        <button
          className="action-button action-button--secondary action-button--compact"
          onClick={() => onCancel(report)}
          type="button"
        >
          Cancel report
        </button>
      ) : null}
    </li>
  );
}
