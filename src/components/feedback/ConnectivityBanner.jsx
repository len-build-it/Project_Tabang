import { useEffect, useState } from "react";
import Icon from "../ui/Icon.jsx";

/**
 * Tells the resident the device is offline, on every resident screen.
 *
 * `navigator.onLine` only proves the device has a network interface, not that
 * anything is reachable, so the wording avoids promising that being online
 * means a submission will succeed.
 */
export default function ConnectivityBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <p className="offline-banner" role="status">
      <Icon name="wifiOff" />
      <span>
        You&apos;re offline. New reports will be saved on this phone and sent
        when the connection returns. For anything urgent, call 911.
      </span>
    </p>
  );
}
