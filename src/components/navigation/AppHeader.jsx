import { Link, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon.jsx";

/**
 * Back returns to the previous screen when there is one inside the app, and
 * to `backTo` when the page was opened directly from a link or bookmark.
 */
function BackButton({ to }) {
  const navigate = useNavigate();

  function goBack() {
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1);
    } else {
      navigate(to);
    }
  }

  return (
    <button className="app-header__back" onClick={goBack} type="button">
      <Icon name="chevL" />
      <span className="visually-hidden">Back</span>
    </button>
  );
}

export default function AppHeader({
  menu,
  backTo,
  workspaceLabel,
  showSignIn = false,
}) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        {backTo ? <BackButton to={backTo} /> : null}
        <Link aria-label="Tabang home" className="app-header__brand" to="/">
          <span aria-hidden="true" className="app-header__mark">
            <img alt="" src="/images/tabang-logo.png" />
          </span>
          <span>Tabang</span>
        </Link>
        {workspaceLabel ? (
          <span className="app-header__workspace">{workspaceLabel}</span>
        ) : null}
        <span className="app-header__spacer" />
        {showSignIn ? (
          <Link className="app-header__sign-in" to="/login">
            Sign in
          </Link>
        ) : null}
        {menu ? (
          <button
            aria-controls={menu.controls}
            aria-expanded={menu.expanded}
            className="app-header__menu"
            onClick={menu.onOpen}
            type="button"
          >
            <Icon name="menu" />
            <span className="visually-hidden">{menu.label}</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
