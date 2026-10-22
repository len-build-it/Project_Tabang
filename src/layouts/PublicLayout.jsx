import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "../components/navigation/AppHeader.jsx";
import LoadingState from "../components/feedback/LoadingState.jsx";
import SkipLink from "../components/navigation/SkipLink.jsx";
import { usePageChrome } from "../components/navigation/usePageTitle.js";
import { PageHeading } from "../components/ui/Primitives.jsx";

export default function PublicLayout() {
  const { heading } = usePageChrome();
  const location = useLocation();

  return (
    <div className="shell shell--public">
      <SkipLink />
      <AppHeader />
      <main className="shell__content" id="main">
        <PageHeading key={location.pathname}>{heading}</PageHeading>
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
    </div>
  );
}
