import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "../components/navigation/AppHeader.jsx";
import LoadingState from "../components/feedback/LoadingState.jsx";
import SkipLink from "../components/navigation/SkipLink.jsx";
import { usePageChrome } from "../components/navigation/usePageTitle.js";
import { SESSION_STATUS } from "../app/providers/AuthContext.js";
import { useAuth } from "../app/providers/useAuth.js";
import { PageHeading } from "../components/ui/Primitives.jsx";

export default function PublicLayout() {
  const { heading, backTo } = usePageChrome();
  const location = useLocation();
  const { status } = useAuth();
  // Signed-out visitors can always reach sign-in from the header, except on
  // the sign-in page itself.
  const showSignIn =
    status === SESSION_STATUS.anonymous && location.pathname !== "/login";

  return (
    <div className="shell shell--public">
      <SkipLink />
      <AppHeader backTo={backTo} showSignIn={showSignIn} />
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
