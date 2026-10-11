'use strict';

const assert = require('node:assert/strict');
const Core = require('./ordinal-core.js');
const Progression = require('./ordinal-progression.js');

function equal(left, right, message) { assert.equal(Core.compare(left, right), 0, message); }
function run() {
  const zero = Core.fromFinite(0n), one = Core.fromFinite(1n), omega = Core.omega();
  equal(zero, Core.parse('0'), 'zero parses');
  equal(Core.add(one, omega), omega, '1 + ω = ω');
  assert.equal(Core.compare(Core.successor(omega), omega), 1, 'ω + 1 > ω');
  equal(Core.multiply(omega, Core.fromFinite(2n)), Core.parse('ω×2'), 'ω × 2');
  equal(Core.multiply(Core.parse('ω+1'), Core.fromFinite(2n)), Core.parse('ω×2+1'), 'ordinal multiplication is not ordinary coefficient multiplication');
  equal(Core.power(omega, Core.fromFinite(2n)), Core.parse('ω²'), 'ω² = ω × ω');
  equal(Core.power(Core.fromFinite(2n), Core.parse('ω×2')), Core.parse('ω²'), '2^(ω×2)');
  equal(Core.power(Core.fromFinite(2n), Core.parse('ω^(ω+1)')), Core.parse('ω^(ω^(ω+1))'), 'finite-base exponentiation across an infinite limit');
  equal(Core.power(Core.parse('ω+1'), Core.fromFinite(2n)), Core.parse('ω²+ω+1'), '(ω+1)^2');
  assert.equal(Core.compare(Core.power(omega, omega), Core.power(omega, Core.fromFinite(1000000n))), 1, 'ω^ω > ω^1,000,000');
  assert.equal(Core.compare(Core.EPSILON_ZERO, Core.power(omega, omega)), 1, 'ε₀ exceeds every tested ordinal below it');
  equal(Core.parse('ω^2*3+ω*7+5'), Core.parse('ω²×3+ω×7+5'), 'Unicode and plain-text forms normalize equally');
  const nested = Core.parse('ω^(ω^2+ω*3+7)');
  equal(Core.deserialize(Core.serialize(nested)), nested, 'nested serialization round-trips');
  assert.match(Core.toHTML(nested), /<sup>/, 'ordinal HTML uses superscripts');
  assert.equal(Core.format(Core.fundamentalSequence(omega, 9n)), '10', 'ω[9] = 10 under the n+1 convention');
  assert.equal(Core.format(Core.fundamentalSequence(Core.parse('ω²'), 2n)), 'ω×3', 'ω²[2] = ω×3');
  assert.equal(Core.isLimit(omega), true);
  assert.equal(Core.format(Core.predecessor(Core.parse('ω+5'))), 'ω + 4');
  assert.throws(() => Core.parse('ψ(Ω)'), /Unsupported ordinal notation/);
  assert.throws(() => Core.add(Core.EPSILON_ZERO, one), /epsilon-zero/);

  const expectations = new Map([[0n, '1,000,000,000,000'], [1n, '1,100,000,000,000'], [2n, '1,200,000,000,000'], [10n, '2,000,000,000,000'], [100n, '11,000,000,000,000'], [500n, '51,000,000,000,000'], [1000n, '101,000,000,000,000']]);
  for (const [count, formatted] of expectations) {
    assert.equal(Progression.requirementIndex(count), BigInt(formatted.replaceAll(',', '')));
    assert.equal(Progression.requirementText(count), 'Hψ[Ω' + formatted + ']');
  }
  assert.equal(Progression.BASE, 10);
  const enormousSuccessorCount = 10n ** 100n;
  assert.equal(Progression.requirementIndex(enormousSuccessorCount), 1000000000000n + 100000000000n * enormousSuccessorCount, 'requirements retain arbitrary BigInt precision');
  const firstThreshold = Progression.requirementIndex(0n) * Progression.ORDER_SCALE;
  const batchThreshold = Progression.requirementIndex(10n) * Progression.ORDER_SCALE;
  let state = Progression.createState();
  const failed = Progression.successor(state, firstThreshold - 1n);
  assert.equal(failed.ok, false);
  assert.equal(failed.state.successorCount, 0n, 'failed Successor does not increment count');
  for (let i = 0; i < 10; i++) state = Progression.successor(state, batchThreshold).state;
  assert.equal(Core.format(state.current), '10');
  const firstMaximize = Progression.maximize(state);
  assert.equal(Core.format(firstMaximize.state.current), 'ω');
  assert.equal(firstMaximize.state.successorCount, 10n, 'Maximize does not increase Successor count');
  state = Progression.createState(Core.parse('ω+10'), 5n);
  assert.equal(Core.format(Progression.maximize(state).state.current), 'ω×2');
  state = Progression.createState(Core.parse('ω×9+10'), 7n);
  assert.equal(Core.format(Progression.maximize(state).state.current), 'ω^(2)');
  const second = Progression.successor(firstMaximize.state, Progression.requirementIndex(10n) * Progression.ORDER_SCALE);
  assert.equal(second.ok, true);
  assert.equal(second.state.successorCount, 11n);
  assert.equal(Progression.unitsFromNumber(1.25), 1250000n);
  assert.equal(Progression.unitsFromNumber(1e24), 1000000000000000000000000000000n);
  const restored = Progression.deserialize(Progression.serialize(nestedState()));
  assert.equal(Core.format(restored.current), 'ω^(ω^(2) + ω×3 + 7)');
  console.log('Ordinal engine tests passed.');
}
function nestedState() { return Progression.createState(Core.parse('ω^(ω^2+ω*3+7)'), 500n); }

run();

