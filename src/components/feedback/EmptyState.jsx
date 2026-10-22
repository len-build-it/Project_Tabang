import Icon from "../ui/Icon.jsx";

export default function EmptyState({ title, message, icon, children }) {
  return (
    <section className="feedback-card feedback-card--empty">
      {icon ? <Icon className="feedback-card__icon" name={icon} /> : null}
      <div className="feedback-card__text">
        <h2>{title}</h2>
        <p>{message}</p>
        {children ? <div className="button-row">{children}</div> : null}
      </div>
    </section>
  );
}
