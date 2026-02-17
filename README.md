# @thomasseanfahey/domq

Query DOM relationships, not selectors.

`@thomasseanfahey/domq` is a small, ESM-first library for composable DOM traversal (relations) and filtering (predicates) with deterministic ordering and lazy evaluation.

It’s designed for browser extensions, testing tooling, scraping/automation scripts, and any code that needs *relationship-first* DOM queries that don’t fit cleanly into CSS selectors.

## Install

```bash
npm install @thomasseanfahey/domq
```

## Quick start

```js
import { dq } from "@thomasseanfahey/domq";

const start = document.querySelector("#start");

const primary =
  dq(start)
    .closest("[data-card]")
    .descendants()
    .where(dq.attr("data-action").eq("primary"))
    .one();

primary.click();
```

## Why not just selectors?

Selectors are excellent, but they are string-based and don’t express many *relational* queries cleanly, especially when your query starts from an element and needs multi-step traversal:

- “From this element, go up N ancestors, then traverse siblings, then descend, then pick the first match.”
- “Find the second ancestor that has at least 3 siblings matching a runtime predicate.”
- “Traverse across Shadow DOM boundaries (explicitly, not accidentally).”

`domq` gives you a readable pipeline with clear semantics.

## Core concepts

### Relations

Relations transform a set/sequence of elements into another ordered sequence.

Common relations:

- `.self()`
- `.parent()` / `.ancestors()`
- `.children()` / `.descendants()`
- `.siblings()` / `.followingSiblings()` / `.precedingSiblings()`
- `.closest(selector)`
- `.find(selector)`
- `.within(selector)`
- `.until(predicateOrSelector)`

### Predicates

Predicates are composable tests applied via `.where(...)`.

```js
dq.attr("data-x").eq("1")
dq.text().matches(/hello/i)
dq.value().includes("abc")
dq.matches("button, a")
dq.hasClass("active")
dq.role("dialog")
```

Combine them:

```js
const p = dq.and(
  dq.matches("button"),
  dq.attr("data-action").eq("primary")
);
```

### Selection (terminal operations)

Terminal operations evaluate lazily and can short-circuit:

- `.first()` → `Element | null`
- `.one()` → `Element` (throws with diagnostics if not exactly 1)
- `.maybeOne()` → `Element | null` (throws if more than 1)
- `.at(n)` / `.take(n)` / `.skip(n)` / `.slice(a,b)`
- `.exists()` / `.count()` / `.toArray()`
- `.unique()` / `.uniqueBy(fn)`

## Deterministic semantics

- **Ordering** is deterministic and documented in code:
  - `ancestors()` yields *nearest-first*
  - `descendants()` yields *document order*
  - `siblings()` yields *left-to-right DOM order*
- **Snapshot evaluation**: results reflect the DOM at evaluation time.
- **Duplicates**: pipelines may include duplicates; use `.unique()` explicitly.

## Budgets (safety valves)

Guard traversal work in large DOMs:

```js
const el = dq(start)
  .budget({ maxNodes: 50_000, maxDepth: 100, maxMs: 25 })
  .descendants()
  .where(dq.matches("a"))
  .first();
```

## Compile reusable queries

Turn a pipeline into a reusable function:

```js
const getPrimaryCTA = dq.compile(q =>
  q.closest("[data-card]")
   .descendants()
   .where(dq.attr("data-action").eq("primary"))
   .first()
);

const cta = getPrimaryCTA(event.target);
```

## Diagnostics

- `.explain()` returns a readable pipeline description.
- `.debug(label)` and `.tap(fn)` allow inspection.
- `.one()` and `.maybeOne()` throw errors that include pipeline context and samples.

## Shadow DOM (optional)

Shadow traversal is explicit via `domq/shadow`.

```js
import { dq } from "@thomasseanfahey/domq";
import { shadow } from "@thomasseanfahey/domq/shadow";

const el = dq(start)
  .use(shadow)
  .composedAncestors()
  .first();
```

## Extra predicates (optional)

Expensive predicates live in `domq/extra`.

```js
import { dq } from "@thomasseanfahey/domq";
import { extra } from "@thomasseanfahey/domq/extra";

const visibleButtons = dq(document.body)
  .use(extra)
  .descendants()
  .where(dq.matches("button"))
  .where(dq.visible())
  .toArray();
```

## Browser demo (no tooling)

Browsers can’t resolve bare specifiers like `"domq"` without a bundler. For a zero-build demo, use an **import map** pointing at local files.

```html
<script type="importmap">
{
  "imports": {
    "domq": "./src/index.js",
    "domq/shadow": "./src/shadow.js",
    "domq/extra": "./src/extra.js"
  }
}
</script>
<script type="module">
  import { dq } from "@thomasseanfahey/domq";
  console.log(dq(document.body).descendants().count());
</script>
```

Serve the repo directory (modules don’t work reliably over `file://`):

```bash
npx -y serve .
# or
python -m http.server 5173
```

## Development

```bash
npm install
npm test
npm run build:types
npm run pack:check
```

`prepublishOnly` runs tests and emits type declarations to `dist/`.

## License

MIT
