/**
 * Script walking, shared by the player and the translation extractor.
 *
 * Both need to agree on exactly one thing: the key a line of dialogue is filed
 * under. If they disagree, a translated line silently falls back to English and
 * nobody finds out until a reader does.
 *
 * A key is the node's position in the *authored* script -- "interview:finch.12"
 * -- not its position after conditional blocks are resolved. That distinction
 * matters: a conditional that changes which branch runs must not renumber the
 * lines around it, or every translation after it would shift by one.
 */

/**
 * Every node in the script with its stable key, conditional branches included.
 * Conditions are not evaluated: extraction wants every line that could ever be
 * shown, not the ones showing now.
 */
export function keyed(script, prefix) {
  const out = [];
  script.forEach((node, index) => {
    const key = `${prefix}.${index}`;
    out.push({ node, key });
    if (node.then) out.push(...keyed(node.then, key));
  });
  return out;
}

/**
 * The nodes that apply right now, each carrying its stable key.
 * `test` receives a node's `when` function and decides whether it holds.
 */
export function expand(script, prefix, test) {
  const out = [];
  script.forEach((node, index) => {
    const key = `${prefix}.${index}`;
    if (node.when) {
      if (test(node.when)) out.push(...expand(node.then ?? [], key, test));
      return;
    }
    out.push(node.key ? node : { ...node, key });
  });
  return out;
}
