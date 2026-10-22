import { Suspense, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import AppHeader from "../components/navigation/AppHeader.jsx";
import LoadingState from "../components/feedback/LoadingState.jsx";
import SkipLink from "../components/navigation/SkipLink.jsx";
import BottomNav from "../components/navigation/BottomNav.jsx";
import { useAuth } from "../app/providers/useAuth.js";
import { usePageChrome } from "../components/navigation/usePageTitle.js";
import { PageHeading } from "../components/ui/Primitives.jsx";

const baseItems = [
  { to: "/responder", label: "Dashboard", icon: "grid" },
  { to: "/responder/incidents", label: "Incidents", icon: "list" },
  { to: "/responder/advisories", label: "Advisories", icon: "megaphone" },
  { to: "/responder/hotlines", label: "Hotlines", icon: "phone" },
  { to: "/responder/account", label: "Account", icon: "user" },
];

const reviewerItem = {
  to: "/responder/applications",
  label: "Applications",
  icon: "idcard",
};

export default function ResponderLayout() {
  const { heading } = usePageChrome();
  const location = useLocation();
  const { isReviewer } = useAuth();

  // Responders who are not reviewers would only be redirected away, so the
  // link is not shown to them at all.
  const items = useMemo(
    () =>
      isReviewer
        ? [...baseItems.slice(0, 3), reviewerItem, ...baseItems.slice(3)]
        : baseItems,
    [isReviewer],
  );

  return (
    <div className="shell shell--responder">
      <SkipLink />
      <AppHeader workspaceLabel="Responder" />
      <main className="shell__content shell__content--with-nav" id="main">
        <PageHeading key={location.pathname}>{heading}</PageHeading>
        {/* Responders are residents too: they may need to report their own
            flooding or ask for help. */}
        <nav aria-label="Other workspaces" className="workspace-switch">
          <Link to="/app">
            Resident features: report, request help, my reports
          </Link>
        </nav>
        <Suspense
          fallback={
            <LoadingState
              title="Loading"
              message="Fetching this part of the app."
            />
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <BottomNav items={items} />
    </div>
  );
}
