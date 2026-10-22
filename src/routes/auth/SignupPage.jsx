import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FormField,
  FormStatus,
  PasswordField,
} from "../../components/forms/FormField.jsx";
import ErrorState from "../../components/feedback/ErrorState.jsx";
import { useAuth } from "../../app/providers/useAuth.js";
import {
  describeAuthError,
  describeAuthErrorForDiagnostics,
} from "../../services/auth/authErrors.js";
import {
  MIN_PASSWORD_LENGTH,
  validateSignupInput,
} from "../../services/auth/profile.js";

const EMPTY_FORM = {
  displayName: "",
  email: "",
  phone: "",
  barangay: "",
  password: "",
  confirmPassword: "",
};

export default function SignupPage() {
  const { register, initializationError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const { values, errors: fieldErrors, isValid } = validateSignupInput(form);

    setErrors(fieldErrors);

    if (!isValid) {
      return;
    }

    setSubmitting(true);

    try {
      // Registration always creates a resident. Responder access is granted
      // only by a reviewer writing roleAssignments/{uid}.
      await register({
        displayName: values.displayName,
        email: values.email,
        phone: values.phone,
        barangay: values.barangay,
        password: values.password,
      });
      navigate("/app", { replace: true });
    } catch (error) {
      // The code goes to the console so a failure is diagnosable without
      // asking the person to guess. It carries no personal data.
      console.error(describeAuthErrorForDiagnostics(error));
      setFormError(describeAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * A form that cannot possibly work should not be offered.
   *
   * When auth has an initialization error every submission fails identically,
   * and the person is left retyping a password that was never wrong. Saying
   * so up front is more honest than letting them find out one attempt at a
   * time.
   */
  if (initializationError) {
    return (
      <section className="auth-panel">
        <ErrorState
          title="Account creation is unavailable"
          message="We cannot create an account right now. If you need emergency help, call 911 or contact your barangay hall."
        />
      </section>
    );
  }

  return (
    <section className="auth-panel">
      <p className="page-intro">
        You need an account to report flooding and ask for help. Responder
        access is reviewed separately after you sign in.
      </p>

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <FormStatus message={formError} />

        <FormField
          autoComplete="name"
          error={errors.displayName}
          label="Full name"
          name="displayName"
          onChange={setField("displayName")}
          value={form.displayName}
        />

        <FormField
          autoComplete="email"
          error={errors.email}
          inputMode="email"
          label="Email"
          name="email"
          onChange={setField("email")}
          type="email"
          value={form.email}
        />

        <FormField
          autoComplete="tel"
          error={errors.phone}
          hint="Example: 0917 000 0000. Used only so responders can reach you about your own reports."
          inputMode="tel"
          label="Phone number"
          name="phone"
          onChange={setField("phone")}
          type="tel"
          value={form.phone}
        />

        <FormField
          autoComplete="address-level3"
          error={errors.barangay}
          hint="Where you live"
          label="Barangay"
          name="barangay"
          onChange={setField("barangay")}
          value={form.barangay}
        />

        <PasswordField
          autoComplete="new-password"
          error={errors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          label="Password"
          name="password"
          onChange={setField("password")}
          value={form.password}
        />

        <PasswordField
          autoComplete="new-password"
          error={errors.confirmPassword}
          label="Confirm password"
          name="confirmPassword"
          onChange={setField("confirmPassword")}
          value={form.confirmPassword}
        />

        <p className="form-field__hint">
          By creating an account you agree to the{" "}
          <Link to="/privacy">privacy policy and terms</Link>.
        </p>

        <button
          className="action-button action-button--block"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-panel__switch">
        Already have one? <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
}
