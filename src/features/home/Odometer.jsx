/**
 * A number that rolls down like a scoreboard, digit by digit, once `rolled` turns true (e.g.
 * when it scrolls into view). Non-digits (+, spaces, letters) stay put. Screen readers should
 * get the plain value next to it: this is aria-hidden.
 *
 * @param {{ value: string|number, rolled: boolean }} props
 */
export function Odometer({ value, rolled }) {
  return (
    <span aria-hidden="true" className="inline-flex items-start leading-none">
      {String(value)
        .split("")
        .map((ch, i) =>
          /\d/.test(ch) ? (
            <span key={i} className="inline-block h-[1em] overflow-hidden">
              <span
                className="block transition-transform duration-[1800ms] ease-(--ease-out-soft) motion-reduce:transition-none"
                style={{
                  transform: `translateY(${rolled ? -Number(ch) : -9}em)`,
                  transitionDelay: `${i * 90}ms`,
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <span key={n} className="block h-[1em]">
                    {n}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span key={i} className={ch === "+" ? "text-brand" : undefined}>
              {ch === " " ? " " : ch}
            </span>
          ),
        )}
    </span>
  );
}
