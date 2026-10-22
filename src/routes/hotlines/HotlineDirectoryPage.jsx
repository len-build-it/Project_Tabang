import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../app/providers/useAuth.js";
import EmptyState from "../../components/feedback/EmptyState.jsx";
import ErrorState from "../../components/feedback/ErrorState.jsx";
import EmergencyCallCard from "../../components/feedback/EmergencyCallCard.jsx";
import { FormStatus } from "../../components/forms/FormField.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { Badge, Skeleton } from "../../components/ui/Primitives.jsx";
import {
  MAX_COMMENT_LENGTH,
  MAX_RATING,
  MIN_RATING,
  createHotlineRepository,
  validateReview,
} from "../../services/hotlines/hotlineRepository.js";

function formatWhen(millis) {
  return millis ? new Date(millis).toLocaleDateString() : "Never";
}

function HotlineCard({ hotline, canReview, onReview, submitting }) {
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState({});

  function submit(event) {
    event.preventDefault();

    const result = validateReview({ rating, comment });

    setErrors(result.errors);

    if (result.isValid) {
      onReview(hotline, result.values);
    }
  }

  return (
    <li className="report-card hotline-card">
      <div>
        <h2 className="report-card__title">{hotline.organization}</h2>
        {hotline.coverageArea ? (
          <p className="hotline-card__area">
            <Icon name="pin" />
            Covers {hotline.coverageArea}
          </p>
        ) : null}
      </div>

      <div className="report-card__meta">
        {hotline.verified ? (
          <Badge icon="shield" srPrefix="Verification: " tone="success">
            Verified {formatWhen(hotline.verifiedAtMillis)}
          </Badge>
        ) : (
          <Badge icon="help" srPrefix="Verification: " tone="neutral">
            Not yet verified
          </Badge>
        )}
        {hotline.verificationStale ? (
          <Badge icon="clock" tone="warning">
            Verification is old
          </Badge>
        ) : null}
        <span className="hotline-card__rating">
          <Icon name="starF" />
          {hotline.averageRating !== null
            ? `${hotline.averageRating} from ${hotline.ratingCount} ${
                hotline.ratingCount === 1 ? "rating" : "ratings"
              }`
            : "No ratings yet"}
        </span>
      </div>

      <ul className="hotline-rows">
        {hotline.phoneNumbers.map((number) => (
          <li key={number}>
            {/* Anyone may call, signed in or not. */}
            <a
              className="hotline-row"
              href={`tel:${encodeURIComponent(number)}`}
            >
              <Icon name="phone" />
              <span className="hotline-row__number">{number}</span>
              {/* The link's name stays the number itself. */}
              <span aria-hidden="true" className="hotline-row__name">
                Tap to call
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="report-card__time">
        {hotline.verified
          ? `Last verified ${formatWhen(hotline.verifiedAtMillis)}${
              hotline.verifiedBy ? ` by ${hotline.verifiedBy}` : ""
            }`
          : "Nobody has verified this number yet. Confirm it with your barangay if you can."}
      </p>

      {canReview ? (
        <details className="disclosure disclosure--inline">
          <summary>
            <Icon className="disclosure__icon" name="star" />
            <span className="disclosure__title">Rate this number</span>
            <Icon className="disclosure__chevron" name="chevD" />
          </summary>
          <form className="auth-form" noValidate onSubmit={submit}>
            <div className="form-field">
              <label
                className="form-field__label"
                htmlFor={`rating-${hotline.id}`}
              >
                Did this number help?
              </label>
              <select
                className="form-field__input"
                id={`rating-${hotline.id}`}
                onChange={(event) => setRating(event.target.value)}
                value={rating}
              >
                <option value="">Choose a rating</option>
                {Array.from(
                  { length: MAX_RATING - MIN_RATING + 1 },
                  (_, index) => MIN_RATING + index,
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              {errors.rating ? (
                <p className="form-field__error">{errors.rating}</p>
              ) : null}
            </div>

            <div className="form-field">
              <label
                className="form-field__label"
                htmlFor={`comment-${hotline.id}`}
              >
                Comment (optional)
              </label>
              <textarea
                className="form-field__input"
                id={`comment-${hotline.id}`}
                maxLength={MAX_COMMENT_LENGTH}
                onChange={(event) => setComment(event.target.value)}
                rows={2}
                value={comment}
              />
              {errors.comment ? (
                <p className="form-field__error">{errors.comment}</p>
              ) : null}
            </div>

            <button
              className="action-button"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Saving…" : "Save my rating"}
            </button>
          </form>
        </details>
      ) : null}
    </li>
  );
}

/**
 * One directory shared by residents and responders.
 *
 * The legacy resident and responder pages each hardcoded their own copy of the
 * numbers, so the two audiences could be told different things to call.
 */
export default function HotlineDirectoryPage({ hotlineRepository }) {
  const { user, status } = useAuth();
  const uid = user?.uid;
  const repository = useMemo(
    () => hotlineRepository ?? createHotlineRepository(),
    [hotlineRepository],
  );

  const [hotlines, setHotlines] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [actionError, setActionError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const activeRef = useRef(0);

  const load = useCallback(
    async (requestId) => {
      try {
        const results = await repository.listHotlines();

        if (activeRef.current !== requestId) {
          return;
        }

        setHotlines(results);
        setLoadState("ready");
      } catch {
        if (activeRef.current === requestId) {
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

  async function review(hotline, values) {
    setSubmittingId(hotline.id);
    setActionError(null);
    setActionNotice(null);

    try {
      await repository.submitReview({
        hotlineId: hotline.id,
        uid,
        rating: values.rating,
        comment: values.comment,
      });
      setActionNotice(
        "Your rating was saved. Rating again replaces it rather than adding another.",
      );
      refresh();
    } catch {
      setActionError("That rating could not be saved. Try again.");
    } finally {
      setSubmittingId(null);
    }
  }

  const unusable =
    loadState === "error" || (loadState === "ready" && hotlines.length === 0);

  return (
    <div className="page-stack">
      <div className="home-section__header">
        <p className="page-intro">
          Tap a number to call. The directory is public; signed-in visitors can
          rate each number once.
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

      {/* 911 stays pinned above the list, whatever state the list is in. */}
      {unusable ? null : (
        <a className="call-row" href="tel:911">
          <Icon name="phone" />
          <span className="call-row__label">Emergency</span>{" "}
          <span className="call-row__number">911</span>
        </a>
      )}

      <FormStatus message={actionError} />
      <FormStatus message={actionNotice} tone="success" />

      {loadState === "loading" ? (
        <Skeleton label="Loading hotlines" lines={4} />
      ) : null}

      {loadState === "error" ? (
        <ErrorState
          title="The hotline directory could not be loaded"
          message="The listed numbers are unavailable. You can still call 911 or contact your barangay hall."
          actionLabel="Try again"
          onAction={refresh}
        />
      ) : null}

      {loadState === "ready" && hotlines.length === 0 ? (
        <EmptyState
          title="No hotlines listed yet"
          message="A reviewer adds hotline numbers centrally so residents and responders always see the same list. Contact your barangay hall in the meantime."
        />
      ) : null}

      {/* An empty or failed list is never a dead end. */}
      {unusable ? <EmergencyCallCard /> : null}

      {loadState === "ready" && hotlines.length > 0 ? (
        <ul className="report-list">
          {hotlines.map((hotline) => (
            <HotlineCard
              canReview={status === "authenticated"}
              hotline={hotline}
              key={hotline.id}
              onReview={review}
              submitting={submittingId === hotline.id}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
