import { useId, useState } from "react";
import Icon from "../ui/Icon.jsx";

export function FormField({
  id,
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  hint,
  autoComplete,
  inputMode,
  required = true,
}) {
  const generatedId = useId();
  // A fixed id lets an error summary link straight to the field.
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={error ? "form-field has-error" : "form-field"}>
      <label className="form-field__label" htmlFor={fieldId}>
        {label}
      </label>
      {hint ? (
        <p className="form-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="form-field__error" id={errorId}>
          <Icon name="alert" />
          {error}
        </p>
      ) : null}
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : undefined}
        autoComplete={autoComplete}
        className="form-field__input"
        id={fieldId}
        inputMode={inputMode}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
    </div>
  );
}

export function PasswordField({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  autoComplete = "current-password",
}) {
  const fieldId = useId();
  const [revealed, setRevealed] = useState(false);
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={error ? "form-field has-error" : "form-field"}>
      <label className="form-field__label" htmlFor={fieldId}>
        {label}
      </label>
      {hint ? (
        <p className="form-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="form-field__error" id={errorId}>
          <Icon name="alert" />
          {error}
        </p>
      ) : null}
      <div className="form-field__control password-control">
        <input
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : undefined}
          autoComplete={autoComplete}
          className="form-field__input"
          id={fieldId}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          required
          type={revealed ? "text" : "password"}
          value={value}
        />
        <button
          aria-pressed={revealed}
          className="form-field__toggle"
          onClick={() => setRevealed((current) => !current)}
          type="button"
        >
          <Icon name={revealed ? "eyeOff" : "eye"} />
          {revealed ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

/**
 * A permanently mounted live region. Screen readers only announce reliably
 * when the region exists before its content changes, so this always renders.
 */
const STATUS_ICONS = {
  error: "alert",
  success: "checkCircle",
  // Something is still in progress, not broken: a clock, not a warning sign.
  warning: "clock",
};

export function FormStatus({ message, tone = "error" }) {
  return (
    <p
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={
        message ? `form-status form-status--${tone}` : "form-status is-empty"
      }
      role={tone === "error" ? "alert" : "status"}
    >
      {message ? <Icon name={STATUS_ICONS[tone] ?? "info"} /> : null}
      {message ? <span>{message}</span> : ""}
    </p>
  );
}
