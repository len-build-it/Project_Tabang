import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import EmptyState from "../../components/feedback/EmptyState.jsx";
import ErrorState from "../../components/feedback/ErrorState.jsx";
import { FormStatus } from "../../components/forms/FormField.jsx";
import IncidentCard from "../../components/incidents/IncidentCard.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { Skeleton } from "../../components/ui/Primitives.jsx";
import { describeActionError } from "../../services/errors/describeActionError.js";
import { createIncidentRepository } from "../../services/incidents/incidentRepository.js";

const STATUS_FILTERS = [
  { value: "open", label: "Open" },
  { value: "new", label: "Unclaimed" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "dispatched", label: "Dispatched" },
  { value: "on_scene", label: "On scene" },
  { value: "resolved", label: "Resolved" },
];

const KIND_FILTERS = [
  { value: "all", label: "All kinds" },
  { value: "flood", label: "Flood" },
  { value: "help", label: "Help" },
];

function FilterSelect({ id, label, value, options, onChange }) {
  return (
    <div className="filter-pill">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon className="filter-pill__chevron" name="chevD" />
    </div>
  );
}

function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export default function IncidentQueuePage({ incidentRepository }) {
  const repository = useMemo(
    () => incidentRepository ?? createIncidentRepository(),
    [incidentRepository],
  );

  const [incidents, setIncidents] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadState, setLoadState] = useState("loading");
  // The dashboard links here with ?status=new to open the unclaimed view.
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(() => {
    const requested = searchParams.get("status");

    return STATUS_FILTERS.some((option) => option.value === requested)
      ? requested
      : "open";
  });
  const [kind, setKind] = useState("all");
  const [claimingId, setClaimingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const activeRef = useRef(0);

  const load = useCallback(
    async (requestId) => {
      try {
        const page = await repository.listIncidents({ status, kind });

        if (activeRef.current !== requestId) {
          return;
        }

        setIncidents(page.incidents);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
        setLoadState("ready");
      } catch {
        if (activeRef.current === requestId) {
          setLoadState("error");
        }
      }
    },
    [repository, status, kind],
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

  // Every open incident is reachable: the queue pages instead of stopping at
  // the first 25.
  async function loadMore() {
    setLoadingMore(true);
    setActionError(null);

    try {
      const page = await repository.listIncidents({ status, kind, cursor });

      setIncidents((current) => [...current, ...page.incidents]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      setActionError(describeActionError(error));
    } finally {
      setLoadingMore(false);
    }
  }

  async function claim(incident) {
    setClaimingId(incident.id);
    setActionError(null);

    try {
      await repository.claimIncident({ incidentId: incident.id });
      refresh();
    } catch (error) {
      // A losing race is expected, not exceptional: say someone holds it now.
      setActionError(describeActionError(error));
      refresh();
    } finally {
      setClaimingId(null);
    }
  }

  const overdueCount = incidents.filter(
    (incident) => incident.isOverdue,
  ).length;

  const filtered = status !== "open" || kind !== "all";

  return (
    <div className="page-stack">
      <div className="home-section__header">
        <p className="page-intro">
          Oldest first, so the longest wait is handled first. Nothing escalates
          on its own; this queue has to be watched.
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

      <FormStatus message={actionError} />

      <div aria-label="Filters" className="filter-bar" role="group">
        <FilterSelect
          id="status-filter"
          label="Status"
          onChange={setStatus}
          options={STATUS_FILTERS}
          value={status}
        />
        <FilterSelect
          id="kind-filter"
          label="Kind"
          onChange={setKind}
          options={KIND_FILTERS}
          value={kind}
        />
      </div>

      {loadState === "ready" ? (
        <p className="report-group__note" role="status">
          {incidents.length}
          {hasMore ? "+" : ""} shown · {labelFor(STATUS_FILTERS, status)} ·{" "}
          {labelFor(KIND_FILTERS, kind)} · oldest first
        </p>
      ) : null}

      {overdueCount > 0 && loadState === "ready" ? (
        <p className="stale-notice" role="status">
          {overdueCount} incident{overdueCount === 1 ? "" : "s"} passed the 15
          minute acknowledgement target and {overdueCount === 1 ? "is" : "are"}{" "}
          still unclaimed.
        </p>
      ) : null}

      {loadState === "loading" ? (
        <Skeleton label="Loading incidents" lines={5} />
      ) : null}

      {loadState === "error" ? (
        <ErrorState
          title="The queue could not be loaded"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={refresh}
        />
      ) : null}

      {loadState === "ready" && incidents.length === 0 ? (
        <EmptyState
          icon="checkCircle"
          title="Nothing in this view"
          message={`No incidents match the current filters: Status ${labelFor(
            STATUS_FILTERS,
            status,
          )}, ${labelFor(KIND_FILTERS, kind)}.`}
        >
          {filtered ? (
            <button
              className="action-button action-button--secondary action-button--compact"
              onClick={() => {
                setStatus("open");
                setKind("all");
              }}
              type="button"
            >
              Clear filters
            </button>
          ) : null}
        </EmptyState>
      ) : null}

      {loadState === "ready" && incidents.length > 0 ? (
        <>
          <ul className="report-list report-list--wide">
            {incidents.map((incident) => (
              <IncidentCard
                claiming={claimingId === incident.id}
                incident={incident}
                key={incident.id}
                onClaim={claim}
              />
            ))}
          </ul>

          {hasMore ? (
            <button
              className="action-button action-button--secondary action-button--block"
              disabled={loadingMore}
              onClick={loadMore}
              type="button"
            >
              {loadingMore ? "Loading…" : "Load more incidents"}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
