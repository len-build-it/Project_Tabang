import {
  NEED_LABELS,
  SEVERITY_LABELS,
} from "../../services/reports/reportSchemas.js";

/*
 * One wording, colour, and icon per report kind and status, shared by the
 * resident screens so a badge means the same thing everywhere.
 */
export const KIND_BADGE = Object.freeze({
  flood: { label: "Flood", tone: "info", icon: "waves" },
  help: { label: "Assistance", tone: "warning", icon: "lifebuoy" },
  advisory: { label: "Advisory", tone: "plain", icon: "megaphone" },
});

export const INCIDENT_BADGE = Object.freeze({
  new: { label: "Awaiting response", tone: "warning", icon: "circleDashed" },
  acknowledged: { label: "Acknowledged", tone: "info", icon: "eye" },
  dispatched: { label: "Responders dispatched", tone: "info", icon: "nav" },
  on_scene: { label: "Responders on scene", tone: "plain", icon: "pin" },
  resolved: { label: "Resolved", tone: "success", icon: "checkCircle" },
  cancelled: { label: "Cancelled", tone: "neutral", icon: "xCircle" },
});

export const VERIFICATION_BADGE = Object.freeze({
  pending: { label: "Not yet verified", tone: "neutral", icon: "help" },
  verified: { label: "Verified", tone: "success", icon: "shield" },
  rejected: {
    label: "Could not be verified",
    tone: "danger",
    icon: "shieldX",
  },
});

export function kindBadge(kind) {
  return KIND_BADGE[kind] ?? KIND_BADGE.advisory;
}

/** "Knee deep", or "Rescue or evacuation · 4 people". */
export function describeReportDetail(report) {
  if (report.kind === "flood") {
    return SEVERITY_LABELS[report.severity] ?? "";
  }

  const need = NEED_LABELS[report.need] ?? "";
  const people = Number(report.peopleAffected);

  if (!people) {
    return need;
  }

  const count = `${people} ${people === 1 ? "person" : "people"}`;

  return need ? `${need} · ${count}` : count;
}
