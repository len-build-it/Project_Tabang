import { useEffect } from "react";
import { useMatches } from "react-router-dom";

function deepestHandle(matches, key) {
  return [...matches].reverse().find((match) => match.handle?.[key])?.handle[
    key
  ];
}

export default function usePageTitle(fallback = "Tabang") {
  const matches = useMatches();
  const title = deepestHandle(matches, "title") ?? fallback;

  useEffect(() => {
    document.title = `${title} | Tabang`;
  }, [title]);

  return title;
}

/**
 * What the page says about itself in its own heading, and whether its header
 * offers a way back. The browser tab keeps the longer `title`, which still
 * names the workspace, while the heading can be the plain question or name
 * the design uses.
 */
export function usePageChrome() {
  const matches = useMatches();
  const title = usePageTitle();

  return {
    heading: deepestHandle(matches, "heading") ?? title,
    backTo: deepestHandle(matches, "backTo") ?? null,
  };
}
