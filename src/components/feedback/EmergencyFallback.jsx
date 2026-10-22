import Icon from "../ui/Icon.jsx";

/**
 * Shown when a report cannot reach the server.
 *
 * A resident whose submission just failed needs a number to ring, not an
 * apology. 911 is always listed; the directory numbers follow when they could
 * be loaded, with the same unverified warning the directory shows.
 */
export default function EmergencyFallback({ hotlines = [], children }) {
  return (
    <section className="fallback-panel">
      <div className="notice notice--danger" role="alert">
        <Icon className="notice__icon" name="device" />
        <div>
          <h2>Your report has not been sent</h2>
          <p>
            It is saved on this phone and will be retried, but nobody has seen
            it yet. Send it from My reports when you have signal. If this is
            urgent, call for help directly now.
          </p>
        </div>
      </div>

      <div className="fallback-panel__calls">
        <a className="action-button action-button--call" href="tel:911">
          <Icon name="phone" />
          Call 911
        </a>
        <ul className="hotline-rows">
          {hotlines.flatMap((hotline) =>
            hotline.phoneNumbers.map((number) => (
              <li key={`${hotline.id}-${number}`}>
                <a
                  className="hotline-row"
                  href={`tel:${encodeURIComponent(number)}`}
                >
                  <Icon name="phone" />
                  <span className="hotline-row__number">{number}</span>
                  <span className="hotline-row__name">
                    {hotline.organization}
                    {hotline.verified ? "" : " (not yet verified)"}
                  </span>
                </a>
              </li>
            )),
          )}
        </ul>
        {hotlines.length === 0 ? (
          <p>
            You can also contact your barangay hall or the municipal DRRM office
            directly.
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}
