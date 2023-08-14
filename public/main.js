
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
	'use strict';

	/** @returns {void} */
	function noop() {}

	/** @returns {void} */
	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	let src_url_equal_anchor;

	/**
	 * @param {string} element_src
	 * @param {string} url
	 * @returns {boolean}
	 */
	function src_url_equal(element_src, url) {
		if (element_src === url) return true;
		if (!src_url_equal_anchor) {
			src_url_equal_anchor = document.createElement('a');
		}
		// This is actually faster than doing URL(..).href
		src_url_equal_anchor.href = url;
		return element_src === src_url_equal_anchor.href;
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	function null_to_empty(value) {
		return value == null ? '' : value;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
	 * @returns {CustomEvent<T>}
	 */
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
		return new CustomEvent(type, { detail, bubbles, cancelable });
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
	 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
	 * it can be called from an external module).
	 *
	 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
	 *
	 * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
	 *
	 * https://svelte.dev/docs/svelte#onmount
	 * @template T
	 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
	 * @returns {void}
	 */
	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	/**
	 * Schedules a callback to run immediately before the component is unmounted.
	 *
	 * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
	 * only one that runs inside a server-side component.
	 *
	 * https://svelte.dev/docs/svelte#ondestroy
	 * @param {() => any} fn
	 * @returns {void}
	 */
	function onDestroy(fn) {
		get_current_component().$$.on_destroy.push(fn);
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
		}
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	/** @returns {void} */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				const nodes = children(options.target);
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	/**
	 * The current version, as set in package.json.
	 *
	 * https://svelte.dev/docs/svelte-compiler#svelte-version
	 * @type {string}
	 */
	const VERSION = '4.2.0';
	const PUBLIC_VERSION = '4';

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @returns {void}
	 */
	function dispatch_dev(type, detail) {
		document.dispatchEvent(custom_event(type, { version: VERSION, ...detail }, { bubbles: true }));
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append_dev(target, node) {
		dispatch_dev('SvelteDOMInsert', { target, node });
		append(target, node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert_dev(target, node, anchor) {
		dispatch_dev('SvelteDOMInsert', { target, node, anchor });
		insert(target, node, anchor);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach_dev(node) {
		dispatch_dev('SvelteDOMRemove', { node });
		detach(node);
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr_dev(node, attribute, value) {
		attr(node, attribute, value);
		if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
		else dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data_dev(text, data) {
		data = '' + data;
		if (text.data === data) return;
		dispatch_dev('SvelteDOMSetData', { node: text, data });
		text.data = /** @type {string} */ (data);
	}

	function ensure_array_like_dev(arg) {
		if (
			typeof arg !== 'string' &&
			!(arg && typeof arg === 'object' && 'length' in arg) &&
			!(typeof Symbol === 'function' && arg && Symbol.iterator in arg)
		) {
			throw new Error('{#each} only works with iterable values.');
		}
		return ensure_array_like(arg);
	}

	/**
	 * @returns {void} */
	function validate_slots(name, slot, keys) {
		for (const slot_key of Object.keys(slot)) {
			if (!~keys.indexOf(slot_key)) {
				console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
			}
		}
	}

	function construct_svelte_component_dev(component, props) {
		const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
		try {
			const instance = new component(props);
			if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
				throw new Error(error_message);
			}
			return instance;
		} catch (err) {
			const { message } = err;
			if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
				throw new Error(error_message);
			} else {
				throw err;
			}
		}
	}

	/**
	 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
	 *
	 * Can be used to create strongly typed Svelte components.
	 *
	 * #### Example:
	 *
	 * You have component library on npm called `component-library`, from which
	 * you export a component called `MyComponent`. For Svelte+TypeScript users,
	 * you want to provide typings. Therefore you create a `index.d.ts`:
	 * ```ts
	 * import { SvelteComponent } from "svelte";
	 * export class MyComponent extends SvelteComponent<{foo: string}> {}
	 * ```
	 * Typing this makes it possible for IDEs like VS Code with the Svelte extension
	 * to provide intellisense and to use the component like this in a Svelte file
	 * with TypeScript:
	 * ```svelte
	 * <script lang="ts">
	 * 	import { MyComponent } from "component-library";
	 * </script>
	 * <MyComponent foo={'bar'} />
	 * ```
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 * @template {Record<string, any>} [Slots=any]
	 * @extends {SvelteComponent<Props, Events>}
	 */
	class SvelteComponentDev extends SvelteComponent {
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Props}
		 */
		$$prop_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Events}
		 */
		$$events_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Slots}
		 */
		$$slot_def;

		/** @param {import('./public.js').ComponentConstructorOptions<Props>} options */
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error("'target' is a required option");
			}
			super();
		}

		/** @returns {void} */
		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn('Component was already destroyed'); // eslint-disable-line no-console
			};
		}

		/** @returns {void} */
		$capture_state() {}

		/** @returns {void} */
		$inject_state() {}
	}

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	function convert (str, loose) {
		if (str instanceof RegExp) return { keys:false, pattern:str };
		var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
		arr[0] || arr.shift();

		while (tmp = arr.shift()) {
			c = tmp[0];
			if (c === '*') {
				keys.push('wild');
				pattern += '/(.*)';
			} else if (c === ':') {
				o = tmp.indexOf('?', 1);
				ext = tmp.indexOf('.', 1);
				keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
				pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
				if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
			} else {
				pattern += '/' + tmp;
			}
		}

		return {
			keys: keys,
			pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
		};
	}

	function Navaid(base, on404) {
		var rgx, curr, routes=[], $={};

		var fmt = $.format = function (uri) {
			if (!uri) return uri;
			uri = '/' + uri.replace(/^\/|\/$/g, '');
			return rgx.test(uri) && uri.replace(rgx, '/');
		};

		base = '/' + (base || '').replace(/^\/|\/$/g, '');
		rgx = base == '/' ? /^\/+/ : new RegExp('^\\' + base + '(?=\\/|$)\\/?', 'i');

		$.route = function (uri, replace) {
			if (uri[0] == '/' && !rgx.test(uri)) uri = base + uri;
			history[(uri === curr || replace ? 'replace' : 'push') + 'State'](uri, null, uri);
		};

		$.on = function (pat, fn) {
			(pat = convert(pat)).fn = fn;
			routes.push(pat);
			return $;
		};

		$.run = function (uri) {
			var i=0, params={}, arr, obj;
			if (uri = fmt(uri || location.pathname)) {
				uri = uri.match(/[^\?#]*/)[0];
				for (curr = uri; i < routes.length; i++) {
					if (arr = (obj=routes[i]).pattern.exec(uri)) {
						for (i=0; i < obj.keys.length;) {
							params[obj.keys[i]] = arr[++i] || null;
						}
						obj.fn(params); // todo loop?
						return $;
					}
				}
				if (on404) on404(uri);
			}
			return $;
		};

		$.listen = function (u) {
			wrap('push');
			wrap('replace');

			function run(e) {
				$.run();
			}

			function click(e) {
				var x = e.target.closest('a'), y = x && x.getAttribute('href');
				if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button || e.defaultPrevented) return;
				if (!y || x.target || x.host !== location.host || y[0] == '#') return;
				if (y[0] != '/' || rgx.test(y)) {
					e.preventDefault();
					$.route(y);
				}
			}

			addEventListener('popstate', run);
			addEventListener('replacestate', run);
			addEventListener('pushstate', run);
			addEventListener('click', click);

			$.unlisten = function () {
				removeEventListener('popstate', run);
				removeEventListener('replacestate', run);
				removeEventListener('pushstate', run);
				removeEventListener('click', click);
			};

			return $.run(u);
		};

		return $;
	}

	function wrap(type, fn) {
		if (history[type]) return;
		history[type] = type;
		fn = history[type += 'State'];
		history[type] = function (uri) {
			var ev = new Event(type.toLowerCase());
			ev.uri = uri;
			fn.apply(this, arguments);
			return dispatchEvent(ev);
		};
	}

	/* src\components\Nav.svelte generated by Svelte v4.2.0 */
	const file$5 = "src\\components\\Nav.svelte";

	function create_fragment$5(ctx) {
		let nav;
		let ul;
		let li0;
		let a0;
		let t0;
		let a0_class_value;
		let t1;
		let li1;
		let a1;
		let t2;
		let a1_class_value;
		let t3;
		let li2;
		let a2;
		let t4;
		let a2_class_value;

		const block = {
			c: function create() {
				nav = element("nav");
				ul = element("ul");
				li0 = element("li");
				a0 = element("a");
				t0 = text("home");
				t1 = space();
				li1 = element("li");
				a1 = element("a");
				t2 = text("about");
				t3 = space();
				li2 = element("li");
				a2 = element("a");
				t4 = text("blog");
				attr_dev(a0, "class", a0_class_value = "" + (null_to_empty(/*isActive*/ ctx[0]('home')) + " svelte-1hq25gf"));
				attr_dev(a0, "href", "/");
				add_location(a0, file$5, 7, 6, 121);
				attr_dev(li0, "class", "svelte-1hq25gf");
				add_location(li0, file$5, 7, 2, 117);
				attr_dev(a1, "class", a1_class_value = "" + (null_to_empty(/*isActive*/ ctx[0]('about')) + " svelte-1hq25gf"));
				attr_dev(a1, "href", "/about");
				add_location(a1, file$5, 8, 6, 183);
				attr_dev(li1, "class", "svelte-1hq25gf");
				add_location(li1, file$5, 8, 2, 179);
				attr_dev(a2, "class", a2_class_value = "" + (null_to_empty(/*isActive*/ ctx[0]('blog')) + " svelte-1hq25gf"));
				attr_dev(a2, "href", "/blog");
				add_location(a2, file$5, 9, 6, 252);
				attr_dev(li2, "class", "svelte-1hq25gf");
				add_location(li2, file$5, 9, 2, 248);
				attr_dev(ul, "class", "svelte-1hq25gf");
				add_location(ul, file$5, 6, 1, 109);
				attr_dev(nav, "class", "svelte-1hq25gf");
				add_location(nav, file$5, 5, 0, 101);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, nav, anchor);
				append_dev(nav, ul);
				append_dev(ul, li0);
				append_dev(li0, a0);
				append_dev(a0, t0);
				append_dev(ul, t1);
				append_dev(ul, li1);
				append_dev(li1, a1);
				append_dev(a1, t2);
				append_dev(ul, t3);
				append_dev(ul, li2);
				append_dev(li2, a2);
				append_dev(a2, t4);
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*isActive*/ 1 && a0_class_value !== (a0_class_value = "" + (null_to_empty(/*isActive*/ ctx[0]('home')) + " svelte-1hq25gf"))) {
					attr_dev(a0, "class", a0_class_value);
				}

				if (dirty & /*isActive*/ 1 && a1_class_value !== (a1_class_value = "" + (null_to_empty(/*isActive*/ ctx[0]('about')) + " svelte-1hq25gf"))) {
					attr_dev(a1, "class", a1_class_value);
				}

				if (dirty & /*isActive*/ 1 && a2_class_value !== (a2_class_value = "" + (null_to_empty(/*isActive*/ ctx[0]('blog')) + " svelte-1hq25gf"))) {
					attr_dev(a2, "class", a2_class_value);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(nav);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$5.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$5($$self, $$props, $$invalidate) {
		let isActive;
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Nav', slots, []);
		let { active } = $$props;

		$$self.$$.on_mount.push(function () {
			if (active === undefined && !('active' in $$props || $$self.$$.bound[$$self.$$.props['active']])) {
				console.warn("<Nav> was created without expected prop 'active'");
			}
		});

		const writable_props = ['active'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Nav> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('active' in $$props) $$invalidate(1, active = $$props.active);
		};

		$$self.$capture_state = () => ({ active, isActive });

		$$self.$inject_state = $$props => {
			if ('active' in $$props) $$invalidate(1, active = $$props.active);
			if ('isActive' in $$props) $$invalidate(0, isActive = $$props.isActive);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*active*/ 2) {
				$$invalidate(0, isActive = str => active === str ? 'selected' : '');
			}
		};

		return [isActive, active];
	}

	class Nav extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$5, create_fragment$5, safe_not_equal, { active: 1 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Nav",
				options,
				id: create_fragment$5.name
			});
		}

		get active() {
			throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set active(value) {
			throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src\pages\Home.svelte generated by Svelte v4.2.0 */
	const file$4 = "src\\pages\\Home.svelte";

	function create_fragment$4(ctx) {
		let t0;
		let h1;
		let t2;
		let figure;
		let img;
		let img_src_value;
		let t3;
		let figcaption;

		const block = {
			c: function create() {
				t0 = space();
				h1 = element("h1");
				h1.textContent = "Great success!";
				t2 = space();
				figure = element("figure");
				img = element("img");
				t3 = space();
				figcaption = element("figcaption");
				figcaption.textContent = "Good Job!";
				document.title = "Svelte Demo template";
				attr_dev(h1, "class", "svelte-zl0e1a");
				add_location(h1, file$4, 4, 0, 73);
				if (!src_url_equal(img.src, img_src_value = "/img/logo.svg")) attr_dev(img, "src", img_src_value);
				attr_dev(img, "alt", "");
				attr_dev(img, "class", "svelte-zl0e1a");
				add_location(img, file$4, 7, 3, 113);
				add_location(figcaption, file$4, 8, 3, 152);
				attr_dev(figure, "class", "svelte-zl0e1a");
				add_location(figure, file$4, 6, 0, 100);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t0, anchor);
				insert_dev(target, h1, anchor);
				insert_dev(target, t2, anchor);
				insert_dev(target, figure, anchor);
				append_dev(figure, img);
				append_dev(figure, t3);
				append_dev(figure, figcaption);
			},
			p: noop,
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(h1);
					detach_dev(t2);
					detach_dev(figure);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$4.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$4($$self, $$props) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Home', slots, []);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
		});

		return [];
	}

	class Home extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Home",
				options,
				id: create_fragment$4.name
			});
		}
	}

	/* src\pages\Blog.svelte generated by Svelte v4.2.0 */
	const file$3 = "src\\pages\\Blog.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[1] = list[i];
		return child_ctx;
	}

	// (21:0) {#if posts}
	function create_if_block$2(ctx) {
		let ul;
		let each_value = ensure_array_like_dev(/*posts*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				ul = element("ul");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr_dev(ul, "class", "svelte-7xvheh");
				add_location(ul, file$3, 21, 3, 376);
			},
			m: function mount(target, anchor) {
				insert_dev(target, ul, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(ul, null);
					}
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*posts*/ 1) {
					each_value = ensure_array_like_dev(/*posts*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(ul, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(ul);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$2.name,
			type: "if",
			source: "(21:0) {#if posts}",
			ctx
		});

		return block;
	}

	// (23:6) {#each posts as post}
	function create_each_block(ctx) {
		let li;
		let a;
		let t_value = /*post*/ ctx[1].title + "";
		let t;
		let a_href_value;

		const block = {
			c: function create() {
				li = element("li");
				a = element("a");
				t = text(t_value);
				attr_dev(a, "href", a_href_value = "/blog/" + /*post*/ ctx[1].id);
				add_location(a, file$3, 23, 13, 424);
				add_location(li, file$3, 23, 9, 420);
			},
			m: function mount(target, anchor) {
				insert_dev(target, li, anchor);
				append_dev(li, a);
				append_dev(a, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*posts*/ 1 && t_value !== (t_value = /*post*/ ctx[1].title + "")) set_data_dev(t, t_value);

				if (dirty & /*posts*/ 1 && a_href_value !== (a_href_value = "/blog/" + /*post*/ ctx[1].id)) {
					attr_dev(a, "href", a_href_value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(li);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block.name,
			type: "each",
			source: "(23:6) {#each posts as post}",
			ctx
		});

		return block;
	}

	function create_fragment$3(ctx) {
		let t0;
		let h1;
		let t2;
		let if_block_anchor;
		let if_block = /*posts*/ ctx[0] && create_if_block$2(ctx);

		const block = {
			c: function create() {
				t0 = space();
				h1 = element("h1");
				h1.textContent = "Recent posts";
				t2 = space();
				if (if_block) if_block.c();
				if_block_anchor = empty();
				document.title = "Blog";
				add_location(h1, file$3, 18, 0, 335);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t0, anchor);
				insert_dev(target, h1, anchor);
				insert_dev(target, t2, anchor);
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
			},
			p: function update(ctx, [dirty]) {
				if (/*posts*/ ctx[0]) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block$2(ctx);
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(h1);
					detach_dev(t2);
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$3.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$3($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Blog', slots, []);
		let posts = [];

		onMount(async () => {
			fetch("https://jsonplaceholder.typicode.com/posts").then(r => r.json()).then(arr => {
				$$invalidate(0, posts = arr);
			});
		});

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Blog> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({ onMount, posts });

		$$self.$inject_state = $$props => {
			if ('posts' in $$props) $$invalidate(0, posts = $$props.posts);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [posts];
	}

	class Blog extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Blog",
				options,
				id: create_fragment$3.name
			});
		}
	}

	/* src\pages\About.svelte generated by Svelte v4.2.0 */
	const file$2 = "src\\pages\\About.svelte";

	function create_fragment$2(ctx) {
		let t0;
		let h1;
		let t2;
		let p;

		const block = {
			c: function create() {
				t0 = space();
				h1 = element("h1");
				h1.textContent = "About this site";
				t2 = space();
				p = element("p");
				p.textContent = "This is the 'about' page. There's not much here.";
				document.title = "About";
				add_location(h1, file$2, 4, 0, 56);
				add_location(p, file$2, 6, 0, 84);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t0, anchor);
				insert_dev(target, h1, anchor);
				insert_dev(target, t2, anchor);
				insert_dev(target, p, anchor);
			},
			p: noop,
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(h1);
					detach_dev(t2);
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$2.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$2($$self, $$props) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('About', slots, []);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
		});

		return [];
	}

	class About extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "About",
				options,
				id: create_fragment$2.name
			});
		}
	}

	/* src\pages\Article.svelte generated by Svelte v4.2.0 */
	const file$1 = "src\\pages\\Article.svelte";

	// (23:0) {#if post}
	function create_if_block$1(ctx) {
		let h1;
		let t0_value = /*post*/ ctx[0].title + "";
		let t0;
		let t1;
		let div;
		let raw_value = /*post*/ ctx[0].body + "";

		const block = {
			c: function create() {
				h1 = element("h1");
				t0 = text(t0_value);
				t1 = space();
				div = element("div");
				add_location(h1, file$1, 23, 3, 464);
				attr_dev(div, "class", "content svelte-19r337u");
				add_location(div, file$1, 25, 3, 492);
			},
			m: function mount(target, anchor) {
				insert_dev(target, h1, anchor);
				append_dev(h1, t0);
				insert_dev(target, t1, anchor);
				insert_dev(target, div, anchor);
				div.innerHTML = raw_value;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*post*/ 1 && t0_value !== (t0_value = /*post*/ ctx[0].title + "")) set_data_dev(t0, t0_value);
				if (dirty & /*post*/ 1 && raw_value !== (raw_value = /*post*/ ctx[0].body + "")) div.innerHTML = raw_value;		},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(h1);
					detach_dev(t1);
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$1.name,
			type: "if",
			source: "(23:0) {#if post}",
			ctx
		});

		return block;
	}

	function create_fragment$1(ctx) {
		let t;
		let if_block_anchor;
		let if_block = /*post*/ ctx[0] && create_if_block$1(ctx);

		const block = {
			c: function create() {
				t = space();
				if (if_block) if_block.c();
				if_block_anchor = empty();
				document.title = "Post";
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
			},
			p: function update(ctx, [dirty]) {
				if (/*post*/ ctx[0]) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block$1(ctx);
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$1.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	async function load(postid) {
		return fetch(`https://jsonplaceholder.typicode.com/posts/${postid}`).then(r => r.json());
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Article', slots, []);
		let { params = {} } = $$props;
		let post;

		onMount(() => {
			load(params.postid).then(obj => $$invalidate(0, post = obj));
		});

		const writable_props = ['params'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Article> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('params' in $$props) $$invalidate(1, params = $$props.params);
		};

		$$self.$capture_state = () => ({ onMount, params, post, load });

		$$self.$inject_state = $$props => {
			if ('params' in $$props) $$invalidate(1, params = $$props.params);
			if ('post' in $$props) $$invalidate(0, post = $$props.post);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*params*/ 2) {
				load(params.postid).then(obj => $$invalidate(0, post = obj));
			}
		};

		return [post, params];
	}

	class Article extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, { params: 1 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Article",
				options,
				id: create_fragment$1.name
			});
		}

		get params() {
			throw new Error("<Article>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set params(value) {
			throw new Error("<Article>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src\App.svelte generated by Svelte v4.2.0 */
	const file = "src\\App.svelte";

	// (45:3) {:else}
	function create_else_block(ctx) {
		let switch_instance;
		let switch_instance_anchor;
		let current;
		var switch_value = /*Route*/ ctx[0];

		function switch_props(ctx, dirty) {
			return {
				props: { params: /*params*/ ctx[1] },
				$$inline: true
			};
		}

		if (switch_value) {
			switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
		}

		const block = {
			c: function create() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				switch_instance_anchor = empty();
			},
			m: function mount(target, anchor) {
				if (switch_instance) mount_component(switch_instance, target, anchor);
				insert_dev(target, switch_instance_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*Route*/ 1 && switch_value !== (switch_value = /*Route*/ ctx[0])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				} else if (switch_value) {
					const switch_instance_changes = {};
					if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];
					switch_instance.$set(switch_instance_changes);
				}
			},
			i: function intro(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(switch_instance_anchor);
				}

				if (switch_instance) destroy_component(switch_instance, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block.name,
			type: "else",
			source: "(45:3) {:else}",
			ctx
		});

		return block;
	}

	// (43:3) {#if !params}
	function create_if_block(ctx) {
		let switch_instance;
		let switch_instance_anchor;
		let current;
		var switch_value = /*Route*/ ctx[0];

		function switch_props(ctx, dirty) {
			return { $$inline: true };
		}

		if (switch_value) {
			switch_instance = construct_svelte_component_dev(switch_value, switch_props());
		}

		const block = {
			c: function create() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				switch_instance_anchor = empty();
			},
			m: function mount(target, anchor) {
				if (switch_instance) mount_component(switch_instance, target, anchor);
				insert_dev(target, switch_instance_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*Route*/ 1 && switch_value !== (switch_value = /*Route*/ ctx[0])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = construct_svelte_component_dev(switch_value, switch_props());
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(switch_instance_anchor);
				}

				if (switch_instance) destroy_component(switch_instance, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block.name,
			type: "if",
			source: "(43:3) {#if !params}",
			ctx
		});

		return block;
	}

	function create_fragment(ctx) {
		let nav;
		let t;
		let main;
		let current_block_type_index;
		let if_block;
		let current;

		nav = new Nav({
				props: { active: /*active*/ ctx[2] },
				$$inline: true
			});

		const if_block_creators = [create_if_block, create_else_block];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (!/*params*/ ctx[1]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				create_component(nav.$$.fragment);
				t = space();
				main = element("main");
				if_block.c();
				attr_dev(main, "class", "svelte-1z13hn1");
				add_location(main, file, 41, 0, 1043);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(nav, target, anchor);
				insert_dev(target, t, anchor);
				insert_dev(target, main, anchor);
				if_blocks[current_block_type_index].m(main, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const nav_changes = {};
				if (dirty & /*active*/ 4) nav_changes.active = /*active*/ ctx[2];
				nav.$set(nav_changes);
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(main, null);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(nav.$$.fragment, local);
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(nav.$$.fragment, local);
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
					detach_dev(main);
				}

				destroy_component(nav, detaching);
				if_blocks[current_block_type_index].d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('App', slots, []);
		let Route, params, active;
		let uri = location.pathname;

		function run(thunk, obj) {
			$$invalidate(0, Route = thunk);
			$$invalidate(1, params = obj);
			window.scrollTo(0, 0);
		}

		function track(obj) {
			$$invalidate(3, uri = obj.state || obj.uri || location.pathname);
		}

		addEventListener("replacestate", track);
		addEventListener("pushstate", track);
		addEventListener("popstate", track);
		const router = Navaid("/").on("/", () => run(Home)).on("/about", () => run(About)).on("/blog", () => run(Blog)).on("/blog/:postid", obj => run(Article, obj)).listen();
		onDestroy(router.destroy);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			Navaid,
			onDestroy,
			Nav,
			Home,
			Blog,
			About,
			Article,
			Route,
			params,
			active,
			uri,
			run,
			track,
			router
		});

		$$self.$inject_state = $$props => {
			if ('Route' in $$props) $$invalidate(0, Route = $$props.Route);
			if ('params' in $$props) $$invalidate(1, params = $$props.params);
			if ('active' in $$props) $$invalidate(2, active = $$props.active);
			if ('uri' in $$props) $$invalidate(3, uri = $$props.uri);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*uri*/ 8) {
				$$invalidate(2, active = uri.split("/")[1] || "home");
			}
		};

		return [Route, params, active, uri];
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "App",
				options,
				id: create_fragment.name
			});
		}
	}

	const app = new App({
	   target: document.body,
	});

	return app;

})();
//# sourceMappingURL=main.js.map
