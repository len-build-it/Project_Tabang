import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ErrorState from "../../components/feedback/ErrorState.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { ActionLink, Skeleton } from "../../components/ui/Primitives.jsx";
import { createIncidentRepository } from "../../services/incidents/incidentRepository.js";
import {
  METRIC_DEFINITIONS,
  isMetricSetStale,
} from "../../services/metrics/dashboardMetrics.js";

function formatWhen(millis) {
  return millis ? new Date(millis).toLocaleString() : "Never";
}

// Rows that match a queue filter open the queue already filtered.
const QUEUE_FILTERS = {
  unclaimed: "/responder/incidents?status=new",
};

export default function ResponderDashboardPage({ incidentRepository }) {
  const repository = useMemo(
    () => incidentRepository ?? createIncidentRepository(),
    [incidentRepository],
  );

  const [metrics, setMetrics] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const activeRef = useRef(0);

  const load = useCallback(
    async (requestId) => {
      try {
        // Exact counts from the database, however many incidents are open.
        const counts = await repository.countIncidents();

        if (activeRef.current !== requestId) {
          return;
        }

        setMetrics({
          values: counts,
          generatedAtMillis: counts.countedAtMillis,
        });
        setLoadState("ready");
      } catch {
        if (activeRef.current === requestId) {
          // No cached or sample numbers are shown instead. A dashboard that
          // invents figures when the data source fails is worse than one that
          // admits it has nothing.
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

  const refresh = useCallback(() => {
    activeRef.current += 1;
    setLoadState("loading");
    load(activeRef.current);
  }, [load]);

  const stale = metrics !== null && isMetricSetStale(metrics.generatedAtMillis);

  const [headline, ...breakdown] = METRIC_DEFINITIONS;

  return (
    <section aria-labelledby="metrics-heading" className="page-stack">
      <h2 className="visually-hidden" id="metrics-heading">
        Operational summary
      </h2>
      <div className="home-section__header">
        <p className="page-intro">
          {loadState === "ready" && metrics
            ? `Counted at ${formatWhen(metrics.generatedAtMillis)}`
            : "Counted from every open incident in this deployment."}
        </p>
        <button
          className="action-button action-button--secondary action-button--compact"
          onClick={refresh}
          type="button"
        >
          <Icon name="refresh" />
          Refresh
        </button>
      </div>

      {loadState === "loading" ? (
        <Skeleton label="Loading the summary" lines={4} />
      ) : null}

      {loadState === "error" ? (
        <ErrorState
          title="The summary is unavailable"
          message="No figures are shown rather than showing out-of-date or estimated ones. The incident queue may still work."
          actionLabel="Try again"
          onAction={refresh}
        />
      ) : null}

      {loadState === "ready" && metrics ? (
        <>
          {stale ? (
            <p className="stale-notice" role="status">
              These figures were counted at{" "}
              {formatWhen(metrics.generatedAtMillis)} and may be out of date.
              Refresh before acting on them.
            </p>
          ) : null}

          <Link className="metric-hero" to="/responder/incidents">
            <span className="metric-hero__text">
              <strong>{headline.label}</strong>
              <span>{headline.description}</span>
            </span>
            <span className="metric-hero__value">
              {metrics.values[headline.key]}
            </span>
            <Icon name="chevR" />
          </Link>

          <section aria-labelledby="breakdown-heading" className="home-section">
            <h2 id="breakdown-heading">Breakdown</h2>
            <ul className="metric-list">
              {breakdown.map((definition) => {
                const content = (
                  <>
                    <span className="metric-row__text">
                      <strong>{definition.label}</strong>
                      <span>{definition.description}</span>
                    </span>
                    <span className="metric-row__value">
                      {metrics.values[definition.key]}
                    </span>
                  </>
                );

                return (
                  <li key={definition.key}>
                    {QUEUE_FILTERS[definition.key] ? (
                      <Link
                        className="metric-row"
                        to={QUEUE_FILTERS[definition.key]}
                      >
                        {content}
                        <Icon name="chevR" />
                      </Link>
                    ) : (
                      <div className="metric-row">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="home-section__note">
              Counted from every open incident in this deployment. Nothing is
              estimated, projected, or sampled.
            </p>
          </section>
        </>
      ) : null}

      <ActionLink to="/responder/incidents">Open the incident queue</ActionLink>
    </section>
  );
}
