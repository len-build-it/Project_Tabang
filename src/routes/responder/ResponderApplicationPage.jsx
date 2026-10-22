import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/providers/useAuth.js";
import ErrorState from "../../components/feedback/ErrorState.jsx";
import { FormField, FormStatus } from "../../components/forms/FormField.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { Badge, Skeleton } from "../../components/ui/Primitives.jsx";
import { prepareImageForUpload } from "../../services/uploads/prepareImage.js";
import {
  APPLICATION_STATUS,
  CONSENT_VERSION,
  createApplicationRepository,
  validateApplication,
} from "../../services/responders/applicationRepository.js";

const STATUS_COPY = {
  [APPLICATION_STATUS.pending]: {
    tone: "warning",
    icon: "clock",
    label: "Pending review",
    heading: "Your application is being reviewed",
    message:
      "You'll see the result here. You can keep using Tabang as a resident until it is approved. Applying does not grant responder access.",
  },
  [APPLICATION_STATUS.approved]: {
    tone: "success",
    icon: "checkCircle",
    label: "Approved",
    heading: "You're a responder",
    message:
      "You can now work incidents and publish advisories. Sign out and back in if you do not see the responder workspace yet.",
  },
  [APPLICATION_STATUS.rejected]: {
    tone: "danger",
    icon: "xCircle",
    label: "Rejected",
    heading: "Your application wasn't approved",
    message:
      "Read the reviewer's notes below; you can correct your details and apply again.",
  },
};

const EVIDENCE_SLOTS = [
  {
    slot: "identity",
    id: "identity-document",
    label: "Government ID",
    addLabel: "Add ID photo",
  },
  {
    slot: "selfie",
    id: "identity-selfie",
    label: "Selfie",
    addLabel: "Add selfie",
  },
];

export default function ResponderApplicationPage({ applicationRepository }) {
  const { user, profile, isResponder } = useAuth();
  const uid = user?.uid;
  const repository = useMemo(
    () => applicationRepository ?? createApplicationRepository(),
    [applicationRepository],
  );

  const [existing, setExisting] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [form, setForm] = useState({
    organization: "",
    badgeNumber: "",
    municipality: "",
    consentAccepted: false,
  });
  const [documents, setDocuments] = useState({ identity: null, selfie: null });
  // Preview URLs for the chosen photos; released when replaced or on leave.
  const [previews, setPreviews] = useState({ identity: null, selfie: null });
  const previewsRef = useRef(previews);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reapplying, setReapplying] = useState(false);
  const activeRef = useRef(0);

  const load = useCallback(
    async (requestId) => {
      try {
        const application = await repository.getMyApplication(uid);

        if (activeRef.current !== requestId) {
          return;
        }

        setExisting(application);
        setLoadState("ready");
      } catch {
        // A failed load must not look like "no application yet": that would
        // invite a second application while the first is pending.
        if (activeRef.current === requestId) {
          setLoadState("error");
        }
      }
    },
    [repository, uid],
  );

  useEffect(() => {
    activeRef.current += 1;

    // Never look up an application before the session names the applicant.
    if (!uid) {
      return undefined;
    }

    load(activeRef.current);

    return () => {
      activeRef.current += 1;
    };
  }, [load, uid]);

  const retry = useCallback(() => {
    activeRef.current += 1;
    setLoadState("loading");
    load(activeRef.current);
  }, [load]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(
    () => () => {
      for (const url of Object.values(previewsRef.current)) {
        if (url) {
          URL.revokeObjectURL(url);
        }
      }
    },
    [],
  );

  const setField = (field) => (value) =>
    setForm((current) => ({ ...current, [field]: value }));

  async function pickDocument(slot, file) {
    if (!file) {
      return;
    }

    const prepared = await prepareImageForUpload(file);

    if (!prepared.ok) {
      setErrors((current) => ({ ...current, evidence: prepared.reason }));

      return;
    }

    setErrors((current) => ({ ...current, evidence: undefined }));
    setDocuments((current) => ({ ...current, [slot]: prepared.file }));
    setPreviews((current) => {
      if (current[slot]) {
        URL.revokeObjectURL(current[slot]);
      }

      return { ...current, [slot]: URL.createObjectURL(prepared.file) };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const hasEvidence = Boolean(documents.identity && documents.selfie);
    const {
      values,
      errors: fieldErrors,
      isValid,
    } = validateApplication(form, {
      hasEvidence,
    });

    setErrors(fieldErrors);

    if (!isValid) {
      return;
    }

    setSubmitting(true);

    try {
      const identity = await repository.uploadEvidence(documents.identity);
      const selfie = await repository.uploadEvidence(documents.selfie);

      await repository.submitApplication({
        uid,
        values,
        evidence: {
          identityDocumentPath: identity.path,
          selfiePath: selfie.path,
        },
      });

      setExisting({ ...values, status: APPLICATION_STATUS.pending });
      setReapplying(false);
    } catch {
      setFormError("The application could not be sent. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadState === "loading") {
    return <Skeleton label="Loading your application" lines={3} />;
  }

  if (loadState === "error") {
    return (
      <ErrorState
        title="Your application could not be loaded"
        message="Check your connection and try again. Nothing has been submitted or changed."
        actionLabel="Try again"
        onAction={retry}
      />
    );
  }

  if (existing && !reapplying) {
    const copy = STATUS_COPY[existing.status] ?? STATUS_COPY.pending;

    return (
      <section aria-labelledby="application-status" className="status-card">
        <Badge icon={copy.icon} srPrefix="Application: " tone={copy.tone}>
          {copy.label}
        </Badge>
        <h2 id="application-status">{copy.heading}</h2>
        <p>{copy.message}</p>
        <div className="detail-list">
          <span>
            <strong>Organization</strong>
            {existing.organization}
          </span>
          <span>
            <strong>Municipality</strong>
            {existing.municipality}
          </span>
        </div>
        {existing.reviewNotes ? (
          <div className="review-notes">
            <p className="review-notes__label">Reviewer&apos;s notes</p>
            <p>{existing.reviewNotes}</p>
          </div>
        ) : null}
        {existing.status === APPLICATION_STATUS.approved && isResponder ? (
          <Link className="action-button action-button--block" to="/responder">
            Open responder workspace
            <Icon name="arrowR" />
          </Link>
        ) : null}
        {existing.status === APPLICATION_STATUS.rejected ? (
          <button
            className="action-button action-button--block"
            onClick={() => {
              setForm((current) => ({
                ...current,
                organization: existing.organization,
                badgeNumber: existing.badgeNumber ?? "",
                municipality: existing.municipality,
                consentAccepted: false,
              }));
              setReapplying(true);
            }}
            type="button"
          >
            Apply again
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <div className="page-stack">
      <p className="page-intro">
        A reviewer checks your ID and selfie before you can use the responder
        workspace. Sending this does not grant responder access on its own.
      </p>

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <FormStatus message={formError} />

        <section aria-labelledby="applicant-heading" className="surface-card">
          <h2 id="applicant-heading">Applying as</h2>
          <p>
            These come from your account and are not re-entered here, so an
            application always matches the account it belongs to.
          </p>
          <div className="detail-list">
            <span>
              <strong>Name</strong>
              {profile?.displayName || user?.displayName || "Not provided"}
            </span>
            <span>
              <strong>Email</strong>
              {user?.email}
            </span>
            <span>
              <strong>Barangay</strong>
              {profile?.barangay || "Not provided"}
            </span>
          </div>
        </section>

        <FormField
          error={errors.organization}
          hint="LGU, MDRRMO, barangay or volunteer group"
          label="Organization"
          name="organization"
          onChange={setField("organization")}
          value={form.organization}
        />
        <FormField
          error={errors.badgeNumber}
          label="Badge or employee number"
          name="badgeNumber"
          onChange={setField("badgeNumber")}
          value={form.badgeNumber}
        />
        <FormField
          error={errors.municipality}
          label="Municipality you cover"
          name="municipality"
          onChange={setField("municipality")}
          value={form.municipality}
        />

        <fieldset
          className={errors.evidence ? "photo-field has-error" : "photo-field"}
        >
          <legend>Identity evidence</legend>
          <p className="form-field__hint">
            A government ID and a selfie. These are uploaded privately, are
            visible only to you and a reviewer, and are deleted once a decision
            is recorded.
          </p>

          {errors.evidence ? (
            <p className="form-field__error" role="alert">
              <Icon name="alert" />
              {errors.evidence}
            </p>
          ) : null}

          <div className="evidence-grid">
            {EVIDENCE_SLOTS.map(({ slot, id, label, addLabel }) => (
              <div className="evidence-slot" key={slot}>
                <label className="form-field__label" htmlFor={id}>
                  {label}
                </label>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="visually-hidden photo-add__input"
                  id={id}
                  onChange={(event) => {
                    pickDocument(slot, event.target.files?.[0]);
                    event.target.value = "";
                  }}
                  type="file"
                />
                {previews[slot] ? (
                  <>
                    <img
                      alt={`${label} preview`}
                      className="evidence-slot__preview"
                      src={previews[slot]}
                    />
                    <label className="link-button" htmlFor={id}>
                      Replace
                    </label>
                  </>
                ) : (
                  <label className="photo-add photo-add--wide" htmlFor={id}>
                    <Icon name="camera" />
                    {addLabel}
                  </label>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        <div
          className={
            errors.consentAccepted ? "form-field has-error" : "form-field"
          }
        >
          {errors.consentAccepted ? (
            <p className="form-field__error">
              <Icon name="alert" />
              {errors.consentAccepted}
            </p>
          ) : null}
          <label className="consent-row" htmlFor="consent">
            <input
              checked={form.consentAccepted}
              id="consent"
              onChange={(event) =>
                setField("consentAccepted")(event.target.checked)
              }
              type="checkbox"
            />
            <span>
              I agree that Tabang may store and review my identity documents to
              verify responder status, under policy version {CONSENT_VERSION}.
              Read the <Link to="/privacy">privacy policy</Link>.
            </span>
          </label>
        </div>

        <button
          className="action-button action-button--block"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Sending…" : "Send application"}
        </button>
      </form>
    </div>
  );
}
