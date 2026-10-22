import { useState } from "react";
import { Link } from "react-router-dom";
import { FormField } from "../../components/forms/FormField.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { useAuth } from "../../app/providers/useAuth.js";
import { PASSWORD_RESET_ACKNOWLEDGEMENT } from "../../services/auth/authErrors.js";
import { validateEmailOnlyInput } from "../../services/auth/profile.js";

export default function ResetPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState(undefined);
  const [sentTo, setSentTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSentTo(null);

    const { values, errors, isValid } = validateEmailOnlyInput({ email });

    setFieldError(errors.email);

    if (!isValid) {
      return;
    }

    setSubmitting(true);

    try {
      await sendPasswordReset(values.email);
    } catch {
      // Deliberately swallowed. Reporting the failure would reveal whether the
      // address is registered.
    } finally {
      setSubmitting(false);
      setSentTo(values.email);
    }
  }

  if (sentTo) {
    return (
      <section
        aria-labelledby="reset-sent-title"
        className="auth-panel confirmation"
        role="status"
      >
        <span className="confirmation__icon">
          <Icon name="mail" />
        </span>
        <h2 id="reset-sent-title">Check your email</h2>
        <p>{PASSWORD_RESET_ACKNOWLEDGEMENT}</p>
        <p>
          Sent to <strong>{sentTo}</strong>. Nothing after a few minutes?{" "}
          <button
            className="link-button link-button--inline"
            onClick={() => setSentTo(null)}
            type="button"
          >
            Send it again
          </button>
        </p>
        <Link
          className="action-button action-button--secondary action-button--block"
          to="/login"
        >
          Back to sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="auth-panel">
      <p className="page-intro">
        Enter the email you signed up with. We&apos;ll send a link to choose a
        new password if the address has an account.
      </p>

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <FormField
          autoComplete="email"
          error={fieldError}
          inputMode="email"
          label="Email"
          name="email"
          onChange={setEmail}
          type="email"
          value={email}
        />

        <button
          className="action-button action-button--block"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="auth-panel__switch">
        <Link to="/login">Back to sign in</Link>
      </p>
    </section>
  );
}
