import { renderToString } from "katex";
import "katex/dist/katex.min.css";

type Props = { children: string; display?: boolean; label?: string };

// Render authored TeX on the server; no math runtime is sent to the browser.
export function MathFormula({ children, display = false, label }: Props) {
  const markup = renderToString(children, {
    displayMode: display,
    output: "htmlAndMathml",
    throwOnError: true,
    strict: "error",
    trust: false,
  });

  return display
    ? <div className="journal-math-display" role="region" aria-label={label ?? "Mathematical formula"} tabIndex={0} dangerouslySetInnerHTML={{ __html: markup }} />
    : <span className="journal-math-inline" dangerouslySetInnerHTML={{ __html: markup }} />;
}
