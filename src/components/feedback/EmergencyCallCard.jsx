import Icon from "../ui/Icon.jsx";

/**
 * The 911 fallback that keeps a page from becoming a dead end: an empty or
 * failed hotline list, or a link that leads nowhere, still offers a call.
 */
export default function EmergencyCallCard() {
  return (
    <section aria-labelledby="emergency-call-title" className="call-card">
      <h2 className="call-card__title" id="emergency-call-title">
        <Icon name="alert" />
        In an emergency, call 911
      </h2>
      <a className="action-button action-button--call" href="tel:911">
        <Icon name="phone" />
        Call 911 now
      </a>
      <p>If you can&apos;t get through, contact your barangay hall.</p>
    </section>
  );
}
