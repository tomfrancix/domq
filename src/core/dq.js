import { Query } from './query.js';
import { and, or, not, predicate, attr, data, dataset, text, ownText, value, tag, hasClass, matches, role } from './predicates.js';
import { self, parent, ancestors, children, descendants, siblings, followingSiblings, precedingSiblings, next, prev, closest, find, within, until } from './relations.js';

function dq(node) { return Query.from(node); }
dq.all = (iterable) => Query.fromAll(iterable);

dq.compile = (builder) => {
  if (typeof builder !== 'function') throw new TypeError('dq.compile(builder) requires a function');
  return (start, options = undefined) => {
    const q = dq(start);
    if (options) { if (options.budget) q.budget(options.budget); if (options.debug) q.debug(options.debug); }
    return builder(q);
  };
};

dq.use = (plugin) => { if (typeof plugin !== 'function') throw new TypeError('dq.use(plugin) requires a function'); plugin(dq, Query); };

Object.assign(dq, { and, or, not, predicate, attr, data, dataset, text, ownText, value, tag, hasClass, matches, role });
Object.assign(dq, { relations: { self, parent, ancestors, children, descendants, siblings, followingSiblings, precedingSiblings, next, prev, closest, find, within, until } });

Query.installBaseRelations({ self, parent, ancestors, children, descendants, siblings, followingSiblings, precedingSiblings, next, prev, closest, find, within, until });

export { dq };
