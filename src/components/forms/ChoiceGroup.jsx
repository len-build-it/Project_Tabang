import Icon from "../ui/Icon.jsx";

/**
 * A short list of choices as large radio rows instead of a dropdown, so every
 * option is visible and one tap away.
 *
 * The first radio carries `id`, so an error summary link lands on the group.
 */
export default function ChoiceGroup({
  id,
  name,
  legend,
  options,
  value,
  onChange,
  error,
}) {
  const errorId = `${id}-error`;

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className={error ? "choice-group has-error" : "choice-group"}
    >
      <legend>{legend}</legend>
      {error ? (
        <p className="form-field__error" id={errorId}>
          <Icon name="alert" />
          {error}
        </p>
      ) : null}
      {options.map((option, index) => (
        <label className="choice-row" key={option.value}>
          <input
            aria-invalid={error ? "true" : undefined}
            checked={value === option.value}
            id={index === 0 ? id : undefined}
            name={name}
            onChange={() => onChange(option.value)}
            type="radio"
            value={option.value}
          />
          <span className="choice-row__label">{option.label}</span>
          {option.icon ? (
            <Icon className="choice-row__icon" name={option.icon} />
          ) : null}
        </label>
      ))}
    </fieldset>
  );
}
