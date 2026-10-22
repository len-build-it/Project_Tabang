import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/useAuth.js";
import { FormField } from "../../components/forms/FormField.jsx";
import EmergencyFallback from "../../components/feedback/EmergencyFallback.jsx";
import ChoiceGroup from "../../components/forms/ChoiceGroup.jsx";
import ErrorSummary from "../../components/forms/ErrorSummary.jsx";
import ImageAttachments from "../../components/forms/ImageAttachments.jsx";
import LocationPicker from "../../components/forms/LocationPicker.jsx";
import PlacePicker from "../../components/forms/PlacePicker.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { createHotlineRepository } from "../../services/hotlines/hotlineRepository.js";
import { createReportRepository } from "../../services/reports/reportRepository.js";
import {
  FLOOD_SEVERITIES,
  HELP_NEEDS,
  NEED_LABELS,
  SEVERITY_LABELS,
} from "../../services/reports/reportSchemas.js";
import { createReportSubmitter } from "../../services/reports/submitReport.js";
import { createStorageUploader } from "../../services/uploads/storageUploader.js";
import {
  SUBMISSION_STATE,
  SUBMISSION_STATE_COPY,
  createSubmissionQueue,
} from "../../services/offline/submissionQueue.js";

const EMPTY_FORM = {
  description: "",
  municipality: "",
  barangay: "",
  landmark: "",
  contactPhone: "",
  latitude: "",
  longitude: "",
  severity: "",
  need: "",
  peopleAffected: "1",
};

const PLACE_IDS = Object.freeze({
  municipality: "report-municipality",
  barangay: "report-barangay",
  landmark: "report-landmark",
  location: "report-location",
});

const DETAIL_IDS = Object.freeze({
  description: "report-description",
  contactPhone: "report-phone",
});

/*
 * Error key to field id, in the order the fields appear. A flood report asks
 * where first, because responders need the place before anything else; a
 * help request asks what is needed first, because that decides who responds.
 */
const FIELD_IDS = Object.freeze({
  flood: Object.freeze({
    ...PLACE_IDS,
    severity: "report-severity",
    ...DETAIL_IDS,
  }),
  help: Object.freeze({
    need: "report-need",
    peopleAffected: "report-people",
    ...PLACE_IDS,
    ...DETAIL_IDS,
  }),
});

const SEVERITY_OPTIONS = FLOOD_SEVERITIES.map((severity) => ({
  value: severity,
  label: SEVERITY_LABELS[severity],
}));

const NEED_ICONS = {
  rescue: "lifebuoy",
  medical: "aid",
  "food-water": "waves",
  shelter: "building",
  other: "help",
};

const NEED_OPTIONS = HELP_NEEDS.map((need) => ({
  value: need,
  label: NEED_LABELS[need],
  icon: NEED_ICONS[need],
}));

/** A number field with large − and + buttons, so nobody fights a keypad. */
function PeopleStepper({ id, value, error, onChange }) {
  const errorId = `${id}-error`;
  const count = Number.parseInt(value, 10);
  const current = Number.isFinite(count) ? count : 1;

  return (
    <div className={error ? "form-field has-error" : "form-field"}>
      <label className="form-field__label" htmlFor={id}>
        How many people need help?
      </label>
      {error ? (
        <p className="form-field__error" id={errorId}>
          <Icon name="alert" />
          {error}
        </p>
      ) : null}
      <div className="stepper">
        <button
          aria-controls={id}
          aria-label="Fewer people"
          className="stepper__button"
          disabled={current <= 1}
          onClick={() => onChange(String(Math.max(1, current - 1)))}
          type="button"
        >
          −
        </button>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          className="form-field__input stepper__value"
          id={id}
          inputMode="numeric"
          min="1"
          name="peopleAffected"
          onChange={(event) => onChange(event.target.value)}
          type="number"
          value={value}
        />
        <button
          aria-controls={id}
          aria-label="More people"
          className="stepper__button"
          onClick={() => onChange(String(current + 1))}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function ReportFormPage({
  kind = "flood",
  reportRepository,
  uploader,
  submissionQueue,
  hotlineRepository,
}) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const submitter = useMemo(
    () =>
      createReportSubmitter({
        repository: reportRepository ?? createReportRepository(),
        uploader: uploader ?? createStorageUploader(),
        queue: submissionQueue ?? createSubmissionQueue(),
      }),
    [reportRepository, uploader, submissionQueue],
  );
  const hotlines = useMemo(
    () => hotlineRepository ?? createHotlineRepository(),
    [hotlineRepository],
  );

  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    contactPhone: profile?.phone ?? "",
  }));
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [failure, setFailure] = useState(null);
  const [fallbackHotlines, setFallbackHotlines] = useState([]);
  const [progress, setProgress] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState(null);

  // One id per form session. Retrying reuses it, so a duplicate click or a
  // resend after a timeout cannot file the same emergency twice.
  const reportIdRef = useRef(crypto.randomUUID());
  const abortRef = useRef(null);

  const setField = useCallback(
    (field) => (value) =>
      setForm((current) => ({ ...current, [field]: value })),
    [],
  );

  async function loadFallbackHotlines() {
    try {
      setFallbackHotlines(await hotlines.listHotlines());
    } catch {
      // 911 and the barangay guidance still show.
      setFallbackHotlines([]);
    }
  }

  async function send({ skipPhotos = false } = {}) {
    if (submitting) {
      return;
    }

    setFailure(null);
    setSubmitting(true);
    setSubmissionState(SUBMISSION_STATE.sending);
    abortRef.current = new AbortController();

    try {
      const result = await submitter.submit({
        reportId: reportIdRef.current,
        reporterId: user.uid,
        kind,
        form,
        attachments,
        skipPhotos,
        signal: abortRef.current.signal,
        onProgress: setProgress,
      });

      if (result.status === "invalid") {
        setSubmissionState(null);
        setErrors(result.errors);
        setFailedAttempts((count) => count + 1);

        return;
      }

      setErrors({});

      if (result.status === "submitted") {
        // Only now may this be called sent: the database accepted it.
        setSubmissionState(SUBMISSION_STATE.submitted);
        navigate("/app/reports", { replace: true });

        return;
      }

      // The form keeps everything the resident typed so they can retry, and
      // the entry stays queued. The wording never claims delivery.
      setSubmissionState(SUBMISSION_STATE.failed);
      setFailure(result);

      if (result.reason !== "upload") {
        await loadFallbackHotlines();
      }
    } finally {
      setSubmitting(false);
      setProgress(null);
      abortRef.current = null;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    send();
  }

  const isFlood = kind === "flood";
  const fieldIds = FIELD_IDS[isFlood ? "flood" : "help"];

  const place = (
    <>
      <PlacePicker
        errors={errors}
        ids={fieldIds}
        onChange={(changes) =>
          setForm((current) => ({ ...current, ...changes }))
        }
        values={form}
      />

      <LocationPicker
        error={errors.location}
        id={fieldIds.location}
        latitude={form.latitude}
        longitude={form.longitude}
        onChange={({ latitude, longitude }) =>
          setForm((current) => ({ ...current, latitude, longitude }))
        }
      />
    </>
  );

  return (
    <div className="page-stack">
      <p className="page-intro">
        {isFlood
          ? "Tell responders where the water is and how deep it has reached. "
          : "Tell responders what you need and how many people are with you. "}
        In danger now? Call <a href="tel:911">911</a>.
      </p>

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <ErrorSummary
          attempt={failedAttempts}
          errors={errors}
          fields={fieldIds}
        />

        {failure?.reason === "upload" ? (
          <section className="notice notice--warning" role="alert">
            <Icon className="notice__icon" name="image" />
            <div>
              <h2>The photos could not be uploaded</h2>
              <p>
                {failure.message} Your report is saved on this phone. Send it
                now without them; responders can still act on it.
              </p>
              <button
                className="action-button action-button--block"
                disabled={submitting}
                onClick={() => send({ skipPhotos: true })}
                type="button"
              >
                Send without photos
              </button>
            </div>
          </section>
        ) : null}

        {failure && failure.reason !== "upload" ? (
          <>
            <p className="form-field__error" role="status">
              {failure.message}
            </p>
            <EmergencyFallback hotlines={fallbackHotlines}>
              <Link
                className="action-button action-button--secondary"
                to="/app/reports"
              >
                Go to My reports
              </Link>
            </EmergencyFallback>
          </>
        ) : null}

        {isFlood ? (
          <>
            <fieldset className="field-group">
              <legend>Where</legend>
              {place}
            </fieldset>

            <ChoiceGroup
              error={errors.severity}
              id={fieldIds.severity}
              legend="How deep is the water?"
              name="severity"
              onChange={setField("severity")}
              options={SEVERITY_OPTIONS}
              value={form.severity}
            />
          </>
        ) : (
          <>
            <ChoiceGroup
              error={errors.need}
              id={fieldIds.need}
              legend="What do you need?"
              name="need"
              onChange={setField("need")}
              options={NEED_OPTIONS}
              value={form.need}
            />

            <PeopleStepper
              error={errors.peopleAffected}
              id={fieldIds.peopleAffected}
              onChange={setField("peopleAffected")}
              value={form.peopleAffected}
            />

            <fieldset className="field-group">
              <legend>Where</legend>
              {place}
            </fieldset>
          </>
        )}

        <div
          className={errors.description ? "form-field has-error" : "form-field"}
        >
          <label className="form-field__label" htmlFor={fieldIds.description}>
            {isFlood ? "What is happening?" : "Tell responders more"}
          </label>
          {errors.description ? (
            <p
              className="form-field__error"
              id={`${fieldIds.description}-error`}
            >
              <Icon name="alert" />
              {errors.description}
            </p>
          ) : null}
          <textarea
            aria-describedby={
              errors.description ? `${fieldIds.description}-error` : undefined
            }
            aria-invalid={errors.description ? "true" : undefined}
            className="form-field__input"
            id={fieldIds.description}
            onChange={(event) => setField("description")(event.target.value)}
            rows={4}
            value={form.description}
          />
        </div>

        <FormField
          autoComplete="tel"
          error={errors.contactPhone}
          hint="So responders can reach you. Shared only with responders handling this report."
          id={fieldIds.contactPhone}
          inputMode="tel"
          label="Contact number"
          name="contactPhone"
          onChange={setField("contactPhone")}
          type="tel"
          value={form.contactPhone}
        />

        <ImageAttachments
          attachments={attachments}
          disabled={submitting}
          onChange={setAttachments}
        />

        {submitting ? (
          <section className="send-status" role="status">
            <p className="send-status__title">
              <Icon name="loader" />
              {SUBMISSION_STATE_COPY[SUBMISSION_STATE.sending]}
            </p>
            {progress ? (
              <>
                <progress
                  aria-label="Photo upload progress"
                  className="send-status__bar"
                  max="100"
                  value={progress.percent}
                />
                <p>
                  Uploading photo {progress.index} of {progress.total} (
                  {progress.percent}%). Keep this page open.
                </p>
              </>
            ) : (
              <p>Keep this page open.</p>
            )}
          </section>
        ) : submissionState && submissionState !== SUBMISSION_STATE.sending ? (
          <p aria-live="polite" className="form-field__hint">
            {SUBMISSION_STATE_COPY[submissionState]}
          </p>
        ) : null}

        <div className="form-actions">
          <button
            className="action-button action-button--block"
            disabled={submitting}
            type="submit"
          >
            <Icon name={submitting ? "loader" : "send"} />
            {submitting ? "Sending…" : isFlood ? "Send report" : "Send request"}
          </button>
          {submitting ? (
            <button
              className="action-button action-button--secondary action-button--block"
              onClick={() => abortRef.current?.abort()}
              type="button"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
