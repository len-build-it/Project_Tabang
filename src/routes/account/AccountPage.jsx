import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/useAuth.js";
import { FormField, FormStatus } from "../../components/forms/FormField.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { validateProfileInput } from "../../services/auth/profile.js";
import { describeActionError } from "../../services/errors/describeActionError.js";

const ROLE_LABELS = {
  resident: "Resident",
  responder: "Responder",
  reviewer: "Reviewer",
  admin: "Administrator",
};

function ProfileForm({ user, profile, updateOwnProfile }) {
  const [form, setForm] = useState(() => ({
    displayName: profile?.displayName || user?.displayName || "",
    phone: profile?.phone ?? "",
    barangay: profile?.barangay ?? "",
  }));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const setField = (field) => (value) =>
    setForm((current) => ({ ...current, [field]: value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);

    const { values, errors: fieldErrors, isValid } = validateProfileInput(form);

    setErrors(fieldErrors);

    if (!isValid) {
      return;
    }

    setSaving(true);

    try {
      await updateOwnProfile(user.uid, values);
      setForm(values);
      setStatus({ tone: "success", message: "Your details have been saved." });
    } catch (error) {
      setStatus({ tone: "error", message: describeActionError(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <h2 className="visually-hidden">Your details</h2>
      <FormStatus message={status?.message} tone={status?.tone} />

      <FormField
        autoComplete="name"
        error={errors.displayName}
        label="Full name"
        name="displayName"
        onChange={setField("displayName")}
        value={form.displayName}
      />
      <FormField
        autoComplete="tel"
        error={errors.phone}
        inputMode="tel"
        label="Phone number"
        name="phone"
        onChange={setField("phone")}
        type="tel"
        value={form.phone}
      />
      <FormField
        error={errors.barangay}
        label="Barangay"
        name="barangay"
        onChange={setField("barangay")}
        value={form.barangay}
      />

      <button
        className="action-button action-button--block"
        disabled={saving}
        type="submit"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

export default function AccountPage() {
  const { user, profile, role, isResponder, signOut, updateOwnProfile } =
    useAuth();
  const navigate = useNavigate();
  const [signOutError, setSignOutError] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSignOutError(null);
    setSigningOut(true);

    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      setSignOutError("Sign-out failed. Check your connection and try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="account-identity">
        <p>
          <span className="visually-hidden">Email: </span>
          {user?.email || "Email not provided"}
        </p>
        <span className="role-pill">
          <Icon name="user" />
          Role: {ROLE_LABELS[role] ?? role}
        </span>
      </div>

      {user ? (
        <ProfileForm
          profile={profile}
          updateOwnProfile={updateOwnProfile}
          user={user}
        />
      ) : null}

      {isResponder ? null : (
        <Link className="link-card" to="/app/responder-application">
          <Icon className="link-card__icon" name="shield" />
          <span className="link-card__text">
            <strong>Apply to be a responder</strong>
            <span>For LGU, MDRRMO, barangay and volunteer teams</span>
          </span>
          <Icon name="chevR" />
        </Link>
      )}

      <FormStatus message={signOutError} />

      <button
        className="action-button action-button--secondary action-button--block"
        disabled={signingOut}
        onClick={handleSignOut}
        type="button"
      >
        <Icon name="logout" />
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
