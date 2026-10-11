/* Base-10 game rules layered on top of the separate mathematical CNF core. */
(function (root, factory) {
  const core = root && root.OrdinalCore;
  if (!core) throw new Error('ordinal-core.js must load before ordinal-progression.js');
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LayerOrdinalProgression = api;
})(typeof globalThis === 'object' ? globalThis : this, function (OrdinalCore) {
  'use strict';

  const BASE = 10;
  const REQUIREMENT_START = 1000000000000n;
  const REQUIREMENT_STEP = 100000000000n;
  const ORDER_SCALE = 1000000n;

  function createState(current = OrdinalCore.ZERO, successorCount = 0n) {
    const count = BigInt(successorCount);
    if (count < 0n) throw new RangeError('Successor count cannot be negative.');
    return Object.freeze({ base: BASE, current, successorCount: count });
  }
  function requirementIndex(successorCount) {
    const count = BigInt(successorCount);
    if (count < 0n) throw new RangeError('Successor count cannot be negative.');
    return REQUIREMENT_START + REQUIREMENT_STEP * count;
  }
  function formatInteger(value) { return BigInt(value).toLocaleString('en-US'); }
  function requirementText(successorCount) { return 'Hψ[Ω' + formatInteger(requirementIndex(successorCount)) + ']'; }
  function requirementHTML(successorCount) {
    return 'H<sub>ψ[Ω' + formatInteger(requirementIndex(successorCount)) + ']</sub>';
  }
  function hasRequiredLayer(orderUnits, successorCount) {
    const units = BigInt(orderUnits);
    if (units < 0n) return false;
    return units / ORDER_SCALE >= requirementIndex(successorCount);
  }
  function isMaximizeAvailable(current) {
    if (!Array.isArray(current) || current.length === 0) return false;
    const tail = current[current.length - 1];
    return OrdinalCore.isZero(tail.exp) && tail.coefficient === BigInt(BASE);
  }
  function addBaseDigit(terms, exponent, amount) {
    const out = terms.map(term => ({ exp: term.exp, coefficient: term.coefficient }));
    let position = 0;
    while (position < out.length && OrdinalCore.compare(out[position].exp, exponent) > 0) position++;
    let total = BigInt(amount);
    if (position < out.length && OrdinalCore.compare(out[position].exp, exponent) === 0) {
      total += out[position].coefficient;
      out.splice(position, 1);
    }
    const digit = total % BigInt(BASE);
    const carry = total / BigInt(BASE);
    if (digit > 0n) out.splice(position, 0, { exp: exponent, coefficient: digit });
    let normalized = OrdinalCore.normalize(out);
    if (carry > 0n) normalized = addBaseDigit(normalized, OrdinalCore.successor(exponent), carry);
    return normalized;
  }
  function maximize(state) {
    if (state.base !== BASE) throw new RangeError('The ordinal game base is permanently 10.');
    if (!isMaximizeAvailable(state.current)) return { ok: false, state, reason: 'Maximize is available when the current finite tail reaches 10.' };
    const prefix = state.current.slice(0, -1);
    const next = prefix.length === 0
      ? OrdinalCore.omega()
      : addBaseDigit(prefix, prefix[prefix.length - 1].exp, 1n);
    return { ok: true, state: createState(next, state.successorCount) };
  }
  function successor(state, orderUnits) {
    if (state.base !== BASE) throw new RangeError('The ordinal game base is permanently 10.');
    if (!hasRequiredLayer(orderUnits, state.successorCount)) {
      return { ok: false, state, reason: 'Reach ' + requirementText(state.successorCount) + ' Layer first.' };
    }
    return { ok: true, state: createState(OrdinalCore.successor(state.current), state.successorCount + 1n) };
  }
  function serialize(state) {
    if (state.base !== BASE) throw new RangeError('The ordinal game base is permanently 10.');
    return { base: BASE, current: OrdinalCore.serialize(state.current), successorCount: state.successorCount.toString() };
  }
  function deserialize(data) {
    if (!data || data.base !== BASE || !/^(0|[1-9]\d*)$/.test(String(data.successorCount))) throw new TypeError('Invalid Layer Ordinal save.');
    return createState(OrdinalCore.deserialize(data.current), BigInt(data.successorCount));
  }
  function mergeStates(left, right) {
    const count = left.successorCount > right.successorCount ? left.successorCount : right.successorCount;
    const current = OrdinalCore.compare(left.current, right.current) >= 0 ? left.current : right.current;
    return createState(current, count);
  }
  function unitsFromNumber(value) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('Layer-order progress delta must be finite and nonnegative.');
    if (value === 0) return 0n;
    const [mantissa, exponentText] = value.toExponential().split('e');
    const exponent = Number(exponentText);
    const decimalPoint = mantissa.indexOf('.');
    const fractionDigits = decimalPoint < 0 ? 0 : mantissa.length - decimalPoint - 1;
    const digits = BigInt(mantissa.replace('.', ''));
    const shift = exponent - fractionDigits + 6;
    if (shift >= 0) return digits * (10n ** BigInt(shift));
    const divisor = 10n ** BigInt(-shift);
    // Floor each tick so rounding can never unlock a Successor early.
    return digits / divisor;
  }
  function orderUnitsFromLegacyNumber(value) {
    if (!Number.isFinite(value) || value < 0) return 0n;
    return unitsFromNumber(value);
  }

  return Object.freeze({
    BASE, REQUIREMENT_START, REQUIREMENT_STEP, ORDER_SCALE,
    createState, requirementIndex, requirementText, requirementHTML, hasRequiredLayer,
    isMaximizeAvailable, maximize, successor, serialize, deserialize, mergeStates,
    unitsFromNumber, orderUnitsFromLegacyNumber
  });
});

