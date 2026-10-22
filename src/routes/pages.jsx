import { Link } from "react-router-dom";
import EmergencyCallCard from "../components/feedback/EmergencyCallCard.jsx";
import AppHeader from "../components/navigation/AppHeader.jsx";
import Icon from "../components/ui/Icon.jsx";
import ErrorState from "../components/feedback/ErrorState.jsx";
import { PageHeading } from "../components/ui/Primitives.jsx";
import usePageTitle from "../components/navigation/usePageTitle.js";

export function LandingRoute() {
  return (
    <div className="landing">
      <div className="landing__brand">
        <img
          alt="Tabang, together in times of crisis"
          src="/images/tabang-logo.png"
        />
        <p>Flood reporting and response for Aklan</p>
      </div>

      {/* 911 is the only orange element here and the first thing under the
          heading, so a frightened visitor finds it without reading. */}
      <a className="call-hero" href="tel:911">
        <span className="call-hero__icon">
          <Icon name="phone" />
        </span>
        <span className="call-hero__text">
          <span className="call-hero__number">911</span>{" "}
          <span>Emergency · free from any phone</span>
        </span>
      </a>

      <Link className="link-card" to="/hotlines">
        <Icon className="link-card__icon" name="phone" />
        <span className="link-card__text">
          <strong>Hotline directory</strong>
          <span>MDRRMO, barangay and rescue numbers</span>
        </span>
        <Icon name="chevR" />
      </Link>

      <hr className="landing__divider" />

      <section aria-labelledby="landing-account" className="landing__account">
        <h2 id="landing-account">Report flooding or ask for help</h2>
        <p>
          Sign in to send a report and follow what happens to it. Responder
          access is reviewed separately.
        </p>
        <Link
          className="action-button action-button--secondary action-button--block"
          to="/login"
        >
          Sign in
        </Link>
        <Link className="text-link" to="/signup">
          Create an account
        </Link>
      </section>

      <Link className="text-link text-link--quiet" to="/privacy">
        Privacy policy and terms
      </Link>
    </div>
  );
}

export function RouteErrorPage() {
  usePageTitle("Page error");

  return (
    <div className="shell shell--public">
      <main className="shell__content">
        <PageHeading>This page could not load</PageHeading>
        <ErrorState
          title="Please try again"
          message="Something went wrong while opening this page. Return home and try again."
          actionLabel="Return home"
          onAction={() => {
            window.location.assign("/");
          }}
        />
      </main>
    </div>
  );
}

export function NotFoundRoute() {
  usePageTitle("Page not found");

  return (
    <div className="shell shell--public">
      <AppHeader />
      <main className="shell__content" id="main">
        <PageHeading>Page not found</PageHeading>
        <p className="page-intro">Check the address, or go to the home page.</p>
        <div className="button-pair">
          <Link className="action-button action-button--secondary" to="/">
            Home
          </Link>
          <Link
            className="action-button action-button--secondary"
            to="/hotlines"
          >
            Hotlines
          </Link>
        </div>
        {/* People often arrive from shared links during an event. */}
        <EmergencyCallCard />
      </main>
    </div>
  );
}
