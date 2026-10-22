import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/feedback/EmptyState.jsx";
import ErrorState from "../../components/feedback/ErrorState.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { Badge, Skeleton } from "../../components/ui/Primitives.jsx";
import { kindBadge } from "../../components/reports/reportBadges.js";
import usePendingReports from "../../components/reports/usePendingReports.js";
import { createAdvisoryRepository } from "../../services/advisories/advisoryRepository.js";
import { createSubmissionQueue } from "../../services/offline/submissionQueue.js";

const QUICK_ACTIONS = [
  {
    to: "/app/reports/new",
    label: "Report a flood",
    description: "Tell responders where water is rising",
    icon: "waves",
  },
  {
    to: "/app/help/new",
    label: "Request help",
    description: "Rescue, medical, food, water or shelter",
    icon: "lifebuoy",
  },
  {
    to: "/app/hotlines",
    label: "Hotlines",
    description: "Call MDRRMO, barangay and rescue",
    icon: "phone",
  },
];

const RESOURCES = [
  {
    id: "safety",
    title: "Safety tips",
    icon: "info",
    detail:
      "Stay indoors and move to higher ground early. Never walk or drive through floodwater; six inches of moving water can knock you off your feet. Keep your phone charged and your emergency contacts written down somewhere that does not need power.",
  },
  {
    id: "evacuation",
    title: "Evacuation centers",
    icon: "building",
    detail:
      "Your barangay hall assigns evacuation centers, usually the covered court or school gymnasium. Contact your barangay hall or the municipal DRRM office for the center currently open in your area, and confirm before travelling.",
  },
  {
    id: "first-aid",
    title: "First aid basics",
    icon: "aid",
    detail:
      "Keep wounds clean and dry, and cover them to prevent infection from floodwater. Keep an injured person warm and still. For serious injuries, difficulty breathing, or unconsciousness, contact emergency services immediately rather than treating it yourself.",
  },
];

const STALE_AFTER_MS = 5 * 60 * 1000;

const SOURCE_LABELS = {
  tabang: "Tabang",
  "dost-signal": "DOST signal",
};

/** "35 min ago" within a day, the date and time after that. */
function formatWhen(millis, now = Date.now()) {
  if (!millis) {
    return "Time not recorded";
  }

  const minutes = Math.floor((now - millis) / 60_000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (minutes < 24 * 60) {
    return `${Math.floor(minutes / 60)} h ago`;
  }

  return new Date(millis).toLocaleString();
}

function describePlace(advisory) {
  return (
    [advisory.barangay, advisory.municipality].filter(Boolean).join(", ") ||
    "All of Aklan"
  );
}

function AdvisoryList({ advisories }) {
  if (advisories.length === 0) {
    return (
      <EmptyState
        icon="checkCircle"
        title="No advisories right now"
        message="New advisories from responders and DOST signals show here. Your own reports stay private and are never shown in this list."
      />
    );
  }

  return (
    <ul className="advisory-list">
      {advisories.map((advisory) => {
        const kind = kindBadge(advisory.kind);

        return (
          <li className="advisory-item" key={advisory.id}>
            <div className="advisory-item__meta">
              <Badge icon={kind.icon} srPrefix="Kind: " tone={kind.tone}>
                {kind.label}
              </Badge>
              <span className="advisory-item__place">
                {describePlace(advisory)}
              </span>
            </div>
            <p className="advisory-item__summary">{advisory.summary}</p>
            <p className="advisory-item__time">
              {formatWhen(advisory.createdAtMillis)} · Source:{" "}
              {SOURCE_LABELS[advisory.source] ?? advisory.source}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export default function ResidentHomePage({
  advisoryRepository,
  submissionQueue,
}) {
  const repository = useMemo(
    () => advisoryRepository ?? createAdvisoryRepository(),
    [advisoryRepository],
  );
  const queue = useMemo(
    () => submissionQueue ?? createSubmissionQueue(),
    [submissionQueue],
  );
  const pendingReports = usePendingReports(queue);

  const [advisories, setAdvisories] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [loadedAt, setLoadedAt] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const activeRequestRef = useRef(0);

  /**
   * Only writes state after the await, so the mount effect below never sets
   * state synchronously.
   */
  const runFetch = useCallback(
    async (requestId) => {
      try {
        const results = await repository.listRecentAdvisories();

        if (activeRequestRef.current !== requestId) {
          return;
        }

        setAdvisories(results);
        setLoadedAt(Date.now());
        setIsStale(false);
        setLoadState("ready");
      } catch {
        if (activeRequestRef.current !== requestId) {
          return;
        }

        setLoadState("error");
      }
    },
    [repository],
  );

  const refresh = useCallback(() => {
    activeRequestRef.current += 1;
    setLoadState("loading");
    runFetch(activeRequestRef.current);
  }, [runFetch]);

  useEffect(() => {
    activeRequestRef.current += 1;
    runFetch(activeRequestRef.current);

    return () => {
      // Ignore any in-flight response once this route unmounts.
      activeRequestRef.current += 1;
    };
  }, [runFetch]);

  useEffect(() => {
    if (!loadedAt) {
      return undefined;
    }

    const timer = setTimeout(() => setIsStale(true), STALE_AFTER_MS);

    return () => clearTimeout(timer);
  }, [loadedAt]);

  return (
    <>
      {pendingReports.length > 0 ? (
        <div role="status">
          <Link className="pending-banner" to="/app/reports">
            <Icon className="pending-banner__icon" name="device" />
            <span className="pending-banner__text">
              <strong>
                {pendingReports.length === 1
                  ? "1 report is saved on this phone and not sent yet."
                  : `${pendingReports.length} reports are saved on this phone and not sent yet.`}
              </strong>
              <span>
                Nobody has seen {pendingReports.length === 1 ? "it" : "them"}{" "}
                yet. Open My reports to send now or discard.
              </span>
            </span>
            <Icon name="chevR" />
          </Link>
        </div>
      ) : null}

      <ul aria-label="Quick actions" className="action-list">
        {QUICK_ACTIONS.map((action) => (
          <li key={action.to}>
            <Link
              aria-describedby={`action-${action.icon}-description`}
              aria-labelledby={`action-${action.icon}-title`}
              className="action-row"
              to={action.to}
            >
              <span className="action-row__icon">
                <Icon name={action.icon} />
              </span>
              <span className="action-row__text">
                <span
                  className="action-row__title"
                  id={`action-${action.icon}-title`}
                >
                  {action.label}
                </span>
                <span
                  className="action-row__description"
                  id={`action-${action.icon}-description`}
                >
                  {action.description}
                </span>
              </span>
              <Icon name="chevR" />
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="advisories-heading" className="home-section">
        <div className="home-section__header">
          <h2 id="advisories-heading">Advisories</h2>
          <button
            className="action-button action-button--secondary action-button--compact"
            onClick={refresh}
            type="button"
          >
            Refresh
          </button>
        </div>

        {isStale && loadState === "ready" ? (
          <p className="stale-notice" role="status">
            This list was loaded a while ago and may be out of date. Refresh to
            check for newer advisories.
          </p>
        ) : null}

        {loadState === "loading" ? (
          <Skeleton label="Loading advisories" lines={3} />
        ) : null}

        {loadState === "error" ? (
          <ErrorState
            title="Advisories could not be loaded"
            message="The advisory list is unavailable. This does not affect your ability to submit a report."
            actionLabel="Try again"
            onAction={refresh}
          />
        ) : null}

        {loadState === "ready" ? (
          <AdvisoryList advisories={advisories} />
        ) : null}
      </section>

      <section aria-labelledby="resources-heading" className="home-section">
        <h2 id="resources-heading">Be ready</h2>
        <p className="home-section__note">
          General preparedness guidance. For a live emergency, call 911.
        </p>
        {RESOURCES.map((resource) => (
          <details className="disclosure" key={resource.id}>
            <summary>
              <Icon className="disclosure__icon" name={resource.icon} />
              <span className="disclosure__title">{resource.title}</span>
              <Icon className="disclosure__chevron" name="chevD" />
            </summary>
            <p>{resource.detail}</p>
          </details>
        ))}
      </section>
    </>
  );
}
