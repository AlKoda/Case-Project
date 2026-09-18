/** Very small DOM helpers. Not a framework -- just the three lines of
 *  boilerplate that would otherwise repeat in every screen. */

/** Create an element. Children may be nodes or strings. */
export function el(tag, props, ...children) {
  const node = document.createElement(tag);
  // `null` is a normal way to say "no attributes" at a call site, and a default
  // parameter would not catch it.
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key === "style") {
      for (const [property, setting] of Object.entries(value)) {
        if (property.startsWith("--")) node.style.setProperty(property, setting);
        else node.style[property] = setting;
      }
    }
    else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child);
  }
  return node;
}

export const qs = (selector, scope = document) => scope.querySelector(selector);

/** Remove every child of a node. */
export function clear(node) {
  while (node.firstChild) node.firstChild.remove();
  return node;
}

/** Resolve after `ms`, honouring a caller that wants to bail out early. */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** True when the player has asked the platform for less animation. */
export const reducedMotion = () =>
  document.documentElement.dataset.motion === "reduced" ||
  (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
