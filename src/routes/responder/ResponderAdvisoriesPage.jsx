import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../app/providers/useAuth.js";
import EmptyState from "../../components/feedback/EmptyState.jsx";
import ErrorState from "../../components/feedback/ErrorState.jsx";
import Modal from "../../components/feedback/Modal.jsx";
import { FormField, FormStatus } from "../../components/forms/FormField.jsx";
import { kindBadge } from "../../components/reports/reportBadges.js";
import Icon from "../../components/ui/Icon.jsx";
import { Badge, Skeleton } from "../../components/ui/Primitives.jsx";
import { createAdvisoryRepository } from "../../services/advisories/advisoryRepository.js";
import { collapseWhitespace } from "../../services/auth/profile.js";
import { describeActionError } from "../../services/errors/describeActionError.js";
import { AKLAN_MUNICIPALITIES } from "../../services/places/aklanPlaces.js";

const MAX_SUMMARY = 240;

function formatWhen(millis) {
  return millis ? new Date(millis).toLocaleString() : "Time not recorded";
}

/**
 * Where a responder publishes and withdraws public advisories.
 *
 * Whatever is typed here is shown to everyone, signed in or not, so the copy
 * on the form says so and nothing from a report is filled in automatically.
 */
export default function ResponderAdvisoriesPage({ advisoryRepository }) {
  const { user } = useAuth();
  const actorId = user?.uid;
  const repository = useMemo(
    () => advisoryRepository ?? createAdvisoryRepository(),
    [advisoryRepository],
  );

  const [advisories, setAdvisories] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [form, setForm] = useState({
    summary: "",
    municipality: "",
    barangay: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [working, setWorking] = useState(false);
  const [pendingUnpublish, setPendingUnpublish] = useState(null);
  const activeRef = useRef(0);

  const load = useCallback(
    async (requestId) => {
      try {
        const items = await repository.listOwnAdvisories(actorId);

        if (activeRef.current === requestId) {
          setAdvisories(items);
          setLoadState("ready");
        }
      } catch {
        if (activeRef.current === requestId) {
          setLoadState("error");
        }
      }
    },
    [repository, actorId],
  );

  useEffect(() => {
    activeRef.current += 1;

    if (!actorId) {
      return undefined;
    }

    load(activeRef.current);

    return () => {
      activeRef.current += 1;
    };
  }, [load, actorId]);

  const refresh = useCallback(() => {
    activeRef.current += 1;
    load(activeRef.current);
  }, [load]);

  async function publish(event) {
    event.preventDefault();
    setStatus(null);

    const summary = collapseWhitespace(form.summary);
    const nextErrors = {};

    if (summary.length < 10) {
      nextErrors.summary = "Write at least 10 characters.";
    } else if (summary.length > MAX_SUMMARY) {
      nextErrors.summary = `Keep the advisory under ${MAX_SUMMARY} characters.`;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setWorking(true);

    try {
      await repository.publishAdvisory({
        summary,
        municipality: form.municipality,
        barangay: collapseWhitespace(form.barangay),
      });
      setForm({ summary: "", municipality: "", barangay: "" });
      setStatus({
        tone: "success",
        message: "Published. Residents can see it now.",
      });
      refresh();
    } catch (error) {
      setStatus({ tone: "error", message: describeActionError(error) });
    } finally {
      setWorking(false);
    }
  }

  async function unpublish(id) {
    setPendingUnpublish(null);
    setWorking(true);
    setStatus(null);

    try {
      await repository.unpublishAdvisory(id);
      setStatus({
        tone: "success",
        message: "Unpublished. Residents no longer see it.",
      });
      refresh();
    } catch (error) {
      setStatus({ tone: "error", message: describeActionError(error) });
    } finally {
      setWorking(false);
    }
  }

  const setField = (field) => (value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const summaryLength = collapseWhitespace(form.summary).length;
  const live = advisories.filter((advisory) => advisory.published).length;

  return (
    <div className="page-stack">
      <section aria-labelledby="publish-heading" className="action-panel">
        <h2 className="section-title" id="publish-heading">
          Publish an advisory
        </h2>
        <p className="form-field__hint">
          Advisories are public: anyone opening Tabang can read them. Never
          include names, phone numbers, or house addresses.
        </p>

        <form className="auth-form" noValidate onSubmit={publish}>
          <FormStatus message={status?.message} tone={status?.tone} />

          <div
            className={errors.summary ? "form-field has-error" : "form-field"}
          >
            <label className="form-field__label" htmlFor="advisory-summary">
              Advisory
            </label>
            <p className="form-field__hint" id="advisory-summary-hint">
              What people should know and do, in one or two sentences.
            </p>
            {errors.summary ? (
              <p className="form-field__error" id="advisory-summary-error">
                <Icon name="alert" />
                {errors.summary}
              </p>
            ) : null}
            <textarea
              aria-describedby={
                errors.summary
                  ? "advisory-summary-hint advisory-summary-error"
                  : "advisory-summary-hint"
              }
              aria-invalid={errors.summary ? "true" : undefined}
              className="form-field__input"
              id="advisory-summary"
              maxLength={MAX_SUMMARY}
              onChange={(event) => setField("summary")(event.target.value)}
              rows={3}
              value={form.summary}
            />
            {/* Announced only near the limit, so it does not chatter. */}
            <p
              aria-live={summaryLength > MAX_SUMMARY * 0.8 ? "polite" : "off"}
              className="form-field__hint field-counter"
            >
              {summaryLength} / {MAX_SUMMARY}
            </p>
          </div>

          <div className="form-field">
            <label
              className="form-field__label"
              htmlFor="advisory-municipality"
            >
              Municipality (optional)
            </label>
            <div className="select-control">
              <select
                className="form-field__input"
                id="advisory-municipality"
                onChange={(event) =>
                  setField("municipality")(event.target.value)
                }
                value={form.municipality}
              >
                <option value="">All of Aklan</option>
                {AKLAN_MUNICIPALITIES.map((municipality) => (
                  <option key={municipality} value={municipality}>
                    {municipality}
                  </option>
                ))}
              </select>
              <Icon className="select-control__chevron" name="chevD" />
            </div>
          </div>

          <FormField
            label="Barangay (optional)"
            name="barangay"
            onChange={setField("barangay")}
            required={false}
            value={form.barangay}
          />

          <button
            className="action-button action-button--block"
            disabled={working}
            type="submit"
          >
            <Icon name="megaphone" />
            {working ? "Saving…" : "Publish advisory"}
          </button>
        </form>
      </section>

      <section aria-labelledby="my-advisories-heading" className="report-group">
        <h2 className="report-group__title" id="my-advisories-heading">
          Your advisories
          {loadState === "ready" ? ` · ${live} live` : ""}
        </h2>

        {loadState === "loading" ? (
          <Skeleton label="Loading your advisories" lines={3} />
        ) : null}

        {loadState === "error" ? (
          <ErrorState
            title="Your advisories could not be loaded"
            message="Check your connection and try again."
            actionLabel="Try again"
            onAction={refresh}
          />
        ) : null}

        {loadState === "ready" && advisories.length === 0 ? (
          <EmptyState
            title="You have not published any advisories"
            message="Advisories you publish appear here, where you can also withdraw them."
          />
        ) : null}

        {loadState === "ready" && advisories.length > 0 ? (
          <ul className="report-list">
            {advisories.map((advisory) => {
              const kind = kindBadge(advisory.kind);
              const place =
                [advisory.barangay, advisory.municipality]
                  .filter(Boolean)
                  .join(", ") || "All of Aklan";

              return (
                <li className="report-card" key={advisory.id}>
                  <div className="report-card__meta">
                    <Badge
                      icon={advisory.published ? "checkCircle" : "xCircle"}
                      tone={advisory.published ? "success" : "neutral"}
                    >
                      {advisory.published ? "Published" : "Unpublished"}
                    </Badge>
                    <Badge icon={kind.icon} srPrefix="Kind: " tone={kind.tone}>
                      {kind.label}
                    </Badge>
                    <span className="advisory-item__place">{place}</span>
                  </div>
                  <p className="report-card__body">{advisory.summary}</p>
                  <p className="report-card__time">
                    {formatWhen(advisory.createdAtMillis)}
                  </p>
                  {advisory.published ? (
                    <button
                      className="action-button action-button--danger-outline action-button--compact"
                      disabled={working}
                      onClick={() => setPendingUnpublish(advisory)}
                      type="button"
                    >
                      Unpublish
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <Modal
        confirmLabel="Yes, unpublish"
        confirmTone="danger"
        description="Residents will no longer see this advisory. It stays in your list as unpublished."
        dismissLabel="Keep it published"
        onClose={() => setPendingUnpublish(null)}
        onConfirm={() => unpublish(pendingUnpublish.id)}
        open={Boolean(pendingUnpublish)}
        title="Unpublish this advisory?"
      />
    </div>
  );
}
