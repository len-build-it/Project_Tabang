import { NavLink } from "react-router-dom";
import Icon from "../ui/Icon.jsx";

export default function BottomNav({ items }) {
  return (
    <nav className="bottom-nav-shell" aria-label="Primary route navigation">
      <div className="bottom-nav-shell__inner">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            // Parent routes must not stay highlighted on their child routes.
            end={item.end ?? true}
            className={({ isActive }) =>
              isActive
                ? "bottom-nav-shell__item is-active"
                : "bottom-nav-shell__item"
            }
          >
            {item.icon ? <Icon name={item.icon} /> : null}
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
