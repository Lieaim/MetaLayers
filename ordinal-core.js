/* Exact Cantor-normal-form ordinals below epsilon-zero.
 * This module deliberately does not assign semantics to psi/Ω collapsing functions.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OrdinalCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const EPSILON_ZERO = Object.freeze({ kind: 'epsilon0' });
  const ZERO = Object.freeze([]);
  const ONE = Object.freeze([{ exp: ZERO, coefficient: 1n }]);
  const MAX_FINITE_POWER = 1000000n;
  const MAX_PARSE_LENGTH = 10000;
  const MAX_PARSE_DEPTH = 256;

  function isEpsilonZero(value) { return value === EPSILON_ZERO || (value && value.kind === 'epsilon0'); }
  function assertCnf(value) {
    if (!Array.isArray(value)) throw new TypeError('Expected a Cantor normal form ordinal.');
    return value;
  }
  function isZero(value) { return Array.isArray(value) && value.length === 0; }
  function fromFinite(value) {
    const n = BigInt(value);
    if (n < 0n) throw new RangeError('Ordinals cannot be negative.');
    return n === 0n ? ZERO : Object.freeze([{ exp: ZERO, coefficient: n }]);
  }
  function finiteValue(value) {
    assertCnf(value);
    return value.length === 0 ? 0n : value.length === 1 && isZero(value[0].exp) ? value[0].coefficient : null;
  }
  function compare(left, right) {
    if (isEpsilonZero(left)) return isEpsilonZero(right) ? 0 : 1;
    if (isEpsilonZero(right)) return -1;
    assertCnf(left); assertCnf(right);
    const length = Math.min(left.length, right.length);
    for (let i = 0; i < length; i++) {
      const exponentOrder = compare(left[i].exp, right[i].exp);
      if (exponentOrder) return exponentOrder;
      if (left[i].coefficient !== right[i].coefficient) return left[i].coefficient > right[i].coefficient ? 1 : -1;
    }
    return left.length === right.length ? 0 : left.length > right.length ? 1 : -1;
  }
  function normalize(terms) {
    const sorted = terms.map(term => {
      if (!term || !Array.isArray(term.exp) || isEpsilonZero(term.exp)) throw new TypeError('Exponents must be ordinals below epsilon-zero.');
      const coefficient = BigInt(term.coefficient);
      if (coefficient <= 0n) throw new RangeError('Cantor-normal-form coefficients must be positive.');
      return { exp: term.exp, coefficient };
    }).sort((a, b) => -compare(a.exp, b.exp));
    const result = [];
    for (const term of sorted) {
      const last = result[result.length - 1];
      if (last && compare(last.exp, term.exp) === 0) last.coefficient += term.coefficient;
      else result.push({ ...term });
    }
    return Object.freeze(result.map(term => Object.freeze(term)));
  }
  function monomial(exponent, coefficient = 1n) {
    const c = BigInt(coefficient);
    if (c < 0n) throw new RangeError('Ordinal coefficients cannot be negative.');
    if (c === 0n) return ZERO;
    if (isEpsilonZero(exponent) || !Array.isArray(exponent)) throw new TypeError('Exponent is outside the supported notation.');
    return Object.freeze([{ exp: exponent, coefficient: c }]);
  }
  function omega() { return monomial(ONE); }
  function add(left, right) {
    if (isEpsilonZero(left) || isEpsilonZero(right)) {
      if (isEpsilonZero(left) && isZero(right)) return EPSILON_ZERO;
      throw new RangeError('Arithmetic involving epsilon-zero is not implemented.');
    }
    assertCnf(left); assertCnf(right);
    if (isZero(left)) return right;
    if (isZero(right)) return left;
    const lead = right[0].exp;
    let index = 0;
    while (index < left.length && compare(left[index].exp, lead) > 0) index++;
    const prefix = left.slice(0, index);
    if (index < left.length && compare(left[index].exp, lead) === 0) {
      return normalize(prefix.concat([{ exp: lead, coefficient: left[index].coefficient + right[0].coefficient }], right.slice(1)));
    }
    return normalize(prefix.concat(right));
  }
  function scaleFinite(value, multiplier) {
    const n = BigInt(multiplier);
    if (n < 0n) throw new RangeError('Ordinal multipliers cannot be negative.');
    if (n === 0n || isZero(value)) return ZERO;
    const finite = finiteValue(value);
    if (finite !== null) return fromFinite(finite * n);
    return normalize([{ exp: value[0].exp, coefficient: value[0].coefficient * n }, ...value.slice(1)]);
  }
  function multiply(left, right) {
    if (isEpsilonZero(left) || isEpsilonZero(right)) throw new RangeError('Arithmetic involving epsilon-zero is not implemented.');
    assertCnf(left); assertCnf(right);
    if (isZero(left) || isZero(right)) return ZERO;
    let result = ZERO;
    for (const term of right) {
      const beta = term.exp;
      const contribution = isZero(beta)
        ? scaleFinite(left, term.coefficient)
        : monomial(add(left[0].exp, beta), term.coefficient);
      result = add(result, contribution);
    }
    return result;
  }
  function successor(value) { return add(value, ONE); }
  function isSuccessor(value) { return !isZero(value) && !isEpsilonZero(value) && isZero(value[value.length - 1].exp); }
  function predecessor(value) {
    if (!isSuccessor(value)) throw new RangeError('Only successor ordinals have a predecessor.');
    const result = value.map(term => ({ exp: term.exp, coefficient: term.coefficient }));
    const tail = result[result.length - 1];
    if (tail.coefficient === 1n) result.pop();
    else tail.coefficient--;
    return normalize(result);
  }
  function isLimit(value) { return !isZero(value) && !isEpsilonZero(value) && !isSuccessor(value); }
  function omegaPower(exponent) {
    if (isEpsilonZero(exponent) || !Array.isArray(exponent)) throw new RangeError('ω^ε₀ is outside the supported domain.');
    return isZero(exponent) ? ONE : monomial(exponent);
  }
  function powerFinite(base, exponent) {
    let e = BigInt(exponent);
    if (e < 0n) throw new RangeError('Ordinal exponents cannot be negative.');
    if (e > MAX_FINITE_POWER) throw new RangeError('Finite exponent exceeds the safe materialization limit (1,000,000).');
    let result = ONE, factor = base;
    while (e > 0n) {
      if (e & 1n) result = multiply(result, factor);
      e >>= 1n;
      if (e) factor = multiply(factor, factor);
    }
    return result;
  }
  function finiteBaseLimitExponent(limit) {
    // For finite b>1, b^λ = ω^f(λ) on limit λ. f lowers successor exponents by one.
    return normalize(limit.map(term => {
      const finiteExponent = finiteValue(term.exp);
      return { exp: finiteExponent !== null && finiteExponent > 0n ? predecessor(term.exp) : term.exp, coefficient: term.coefficient };
    }));
  }
  function power(base, exponent) {
    if (isEpsilonZero(base) || isEpsilonZero(exponent)) throw new RangeError('Exponentiation involving epsilon-zero is not implemented.');
    assertCnf(base); assertCnf(exponent);
    if (isZero(exponent)) return ONE;
    if (isZero(base)) return ZERO;
    if (compare(base, ONE) === 0) return ONE;
    const finiteExponent = finiteValue(exponent);
    if (finiteExponent !== null) return powerFinite(base, finiteExponent);

    let limit = exponent, finiteTail = 0n;
    if (isSuccessor(exponent)) {
      const tail = exponent[exponent.length - 1].coefficient;
      finiteTail = tail;
      const prefix = exponent.slice(0, -1);
      limit = prefix.length ? normalize(prefix) : ZERO;
    }
    let limitPower = ONE;
    if (!isZero(limit)) {
      const finiteBase = finiteValue(base);
      if (finiteBase !== null) {
        limitPower = omegaPower(finiteBaseLimitExponent(limit));
      } else {
        limitPower = omegaPower(multiply(base[0].exp, limit));
      }
    }
    return finiteTail ? multiply(limitPower, powerFinite(base, finiteTail)) : limitPower;
  }
  function fundamentalSequence(limit, index) {
    const n = BigInt(index);
    if (n < 0n) throw new RangeError('Fundamental-sequence indices must be nonnegative.');
    if (!isLimit(limit)) throw new RangeError('Fundamental sequences require a nonzero limit ordinal.');
    const terms = limit.map(term => ({ exp: term.exp, coefficient: term.coefficient }));
    const last = terms.pop();
    if (isSuccessor(last.exp)) {
      if (last.coefficient > 1n) terms.push({ exp: last.exp, coefficient: last.coefficient - 1n });
      terms.push({ exp: predecessor(last.exp), coefficient: n + 1n });
      return normalize(terms);
    }
    const lowerExponent = fundamentalSequence(last.exp, n);
    terms.push({ exp: lowerExponent, coefficient: last.coefficient });
    return normalize(terms);
  }
  function serialize(value) {
    if (isEpsilonZero(value)) return { kind: 'epsilon0' };
    assertCnf(value);
    return value.map(term => ({ exp: serialize(term.exp), coefficient: term.coefficient.toString() }));
  }
  function deserialize(data, depth = 0) {
    if (depth > MAX_PARSE_DEPTH) throw new RangeError('Ordinal nesting is too deep.');
    if (data && data.kind === 'epsilon0') return EPSILON_ZERO;
    if (!Array.isArray(data)) throw new TypeError('Invalid serialized ordinal.');
    const terms = data.map(term => ({ exp: deserialize(term.exp, depth + 1), coefficient: BigInt(term.coefficient) }));
    const value = normalize(terms);
    for (let i = 1; i < value.length; i++) if (compare(value[i - 1].exp, value[i].exp) <= 0) throw new TypeError('Serialized ordinal is not in canonical form.');
    return value;
  }
  function format(value, depth = 0) {
    if (depth > MAX_PARSE_DEPTH) return '…';
    if (isEpsilonZero(value)) return 'ε₀';
    if (isZero(value)) return '0';
    return value.map(term => {
      if (isZero(term.exp)) return term.coefficient.toString();
      const exponent = compare(term.exp, ONE) === 0 ? '' : '^(' + format(term.exp, depth + 1) + ')';
      const coefficient = term.coefficient === 1n ? '' : '×' + term.coefficient.toString();
      return 'ω' + exponent + coefficient;
    }).join(' + ');
  }
  function toHTML(value, depth = 0) {
    if (depth > MAX_PARSE_DEPTH) return '<span aria-label="abbreviated">…</span>';
    if (isEpsilonZero(value)) return 'ε<sub>0</sub>';
    if (isZero(value)) return '0';
    const terms = value.length > 128 ? value.slice(0, 64).concat([{ abbreviated: true }], value.slice(-64)) : value;
    return terms.map(term => {
      if (term.abbreviated) return '<span aria-label="terms omitted"> … </span>';
      if (isZero(term.exp)) return term.coefficient.toString();
      const exponent = compare(term.exp, ONE) === 0 ? '' : '<sup>' + toHTML(term.exp, depth + 1) + '</sup>';
      const coefficient = term.coefficient === 1n ? '' : '×' + term.coefficient.toString();
      return 'ω' + exponent + coefficient;
    }).join(' + ');
  }
  function toDOM(value, documentRef = globalThis.document, depth = 0) {
    if (!documentRef || typeof documentRef.createDocumentFragment !== 'function') throw new TypeError('A DOM document is required to render an ordinal.');
    const fragment = documentRef.createDocumentFragment();
    const text = value => documentRef.createTextNode(String(value));
    if (depth > MAX_PARSE_DEPTH) { fragment.append(text('…')); return fragment; }
    if (isEpsilonZero(value)) {
      fragment.append(text('ε'));
      const sub = documentRef.createElement('sub'); sub.append(text('0')); fragment.append(sub);
      return fragment;
    }
    if (isZero(value)) { fragment.append(text('0')); return fragment; }
    const terms = value.length > 128 ? value.slice(0, 64).concat([{ abbreviated: true }], value.slice(-64)) : value;
    terms.forEach((term, index) => {
      if (index) fragment.append(text(' + '));
      if (term.abbreviated) { fragment.append(text('…')); return; }
      if (isZero(term.exp)) { fragment.append(text(term.coefficient)); return; }
      fragment.append(text('ω'));
      if (compare(term.exp, ONE) !== 0) {
        const sup = documentRef.createElement('sup');
        sup.append(toDOM(term.exp, documentRef, depth + 1));
        fragment.append(sup);
      }
      if (term.coefficient !== 1n) fragment.append(text('×' + term.coefficient));
    });
    return fragment;
  }
  function parse(source) {
    if (typeof source !== 'string' || source.length > MAX_PARSE_LENGTH) throw new RangeError('Ordinal expression is missing or too long.');
    const normalized = source
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, text => '^' + [...text].map(char => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(char)).join(''))
      .replace(/[₀]/g, '0').replace(/×/g, '*').replace(/ω|omega/gi, 'w').replace(/ε|epsilon/gi, 'e');
    const tokens = [];
    const pattern = /\s*(e0|w|\d+|[()+*^])/igy;
    let position = 0, match;
    while (position < normalized.length) {
      pattern.lastIndex = position;
      match = pattern.exec(normalized);
      if (!match) throw new SyntaxError('Unsupported ordinal notation near: ' + normalized.slice(position, position + 16));
      tokens.push(match[1].toLowerCase());
      position = pattern.lastIndex;
      if (tokens.length > 20000) throw new RangeError('Ordinal expression has too many tokens.');
    }
    let cursor = 0, depth = 0;
    function peek() { return tokens[cursor]; }
    function consume(token) { if (peek() !== token) throw new SyntaxError('Expected ' + token + '.'); cursor++; }
    function atom() {
      if (++depth > MAX_PARSE_DEPTH) throw new RangeError('Ordinal nesting exceeds 256 levels.');
      const token = peek();
      let value;
      if (token === 'w') { cursor++; value = omega(); }
      else if (token === 'e0') { cursor++; value = EPSILON_ZERO; }
      else if (token && /^\d+$/.test(token)) { cursor++; value = fromFinite(BigInt(token)); }
      else if (token === '(') { cursor++; value = sum(); consume(')'); }
      else throw new SyntaxError('Expected an ordinal term.');
      depth--;
      return value;
    }
    function exponent() { let left = atom(); if (peek() === '^') { cursor++; left = power(left, exponent()); } return left; }
    function product() { let left = exponent(); while (peek() === '*') { cursor++; left = multiply(left, exponent()); } return left; }
    function sum() { let left = product(); while (peek() === '+') { cursor++; left = add(left, product()); } return left; }
    if (!tokens.length) throw new SyntaxError('Ordinal expression is empty.');
    const result = sum();
    if (cursor !== tokens.length) throw new SyntaxError('Unexpected token: ' + tokens[cursor]);
    return result;
  }

  return Object.freeze({
    EPSILON_ZERO, ZERO, ONE, isZero, fromFinite, finiteValue, compare, normalize, monomial, omega,
    add, multiply, power, successor, predecessor, isSuccessor, isLimit, fundamentalSequence,
    serialize, deserialize, format, toHTML, toDOM, parse
  });
});

