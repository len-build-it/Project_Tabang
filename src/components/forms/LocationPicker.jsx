import { useState } from "react";
import Icon from "../ui/Icon.jsx";

/**
 * Optionally attaches the phone's location to a report.
 *
 * Geolocation is offered but never required: it fails indoors, during power
 * cuts, and on older handsets, which is exactly when a flood report matters.
 * The municipality and barangay are what responders always get; typed
 * coordinates are not offered, because nobody can read them off a phone.
 */
export default function LocationPicker({
  id,
  latitude,
  longitude,
  onChange,
  error,
}) {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);
  // Shown back to the resident only; it is not sent with the report.
  const [accuracy, setAccuracy] = useState(null);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const attached = latitude !== "" && longitude !== "";

  function locate() {
    if (!navigator.geolocation) {
      setLocateError(
        "This device cannot share its location. The barangay is enough.",
      );

      return;
    }

    setLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setAccuracy(position.coords.accuracy ?? null);
        onChange({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        });
      },
      () => {
        setLocating(false);
        setLocateError(
          "Location access was refused or timed out. The barangay is enough to send the report.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  function remove() {
    setAccuracy(null);
    onChange({ latitude: "", longitude: "" });
  }

  return (
    <div className={error ? "form-field has-error" : "form-field"}>
      {error ? (
        <p className="form-field__error" id={errorId}>
          <Icon name="alert" />
          {error}
        </p>
      ) : null}

      {attached ? (
        <div className="location-card">
          <Icon className="location-card__icon" name="crosshair" />
          <span className="location-card__text">
            <strong>Location added</strong>
            <span>
              {Number.isFinite(accuracy)
                ? `GPS, accurate to about ${Math.round(accuracy)} m`
                : "From this phone's GPS"}
            </span>
          </span>
          <button className="link-button" onClick={remove} type="button">
            Remove location
          </button>
        </div>
      ) : null}

      <button
        aria-describedby={
          [hintId, error ? errorId : null].filter(Boolean).join(" ") ||
          undefined
        }
        className="action-button action-button--secondary"
        disabled={locating}
        id={id}
        onClick={locate}
        type="button"
      >
        <Icon name="crosshair" />
        {locating
          ? "Locating…"
          : attached
            ? "Update my location"
            : "Use my location"}
      </button>

      <p className="form-field__hint" id={hintId}>
        Optional. Shared only with responders handling your report, never shown
        publicly.
      </p>

      <p aria-live="polite" className="form-field__hint">
        {attached ? "Your current location is attached." : (locateError ?? "")}
      </p>
    </div>
  );
}
