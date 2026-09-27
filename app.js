(function () {
  'use strict';

  var ERROR = 'Error';
  var SIGNIFICANT_DIGITS = 12;
  var DISPLAY_FIT_LENGTH = 9.7;

  function format(value) {
    if (value === null || !isFinite(value)) {
      return ERROR;
    }
    return String(parseFloat(value.toPrecision(SIGNIFICANT_DIGITS)));
  }

  function fitScale(text) {
    if (text.length <= DISPLAY_FIT_LENGTH) {
      return 1;
    }
    return DISPLAY_FIT_LENGTH / text.length;
  }

  function apply(operator, left, right) {
    if (operator === '+') {
      return left + right;
    }
    if (operator === '-') {
      return left - right;
    }
    if (operator === '*') {
      return left * right;
    }
    if (right === 0) {
      return null;
    }
    return left / right;
  }

  function createCalculator() {
    var state = { current: '0', previous: null, operator: null, overwrite: false };

    function resolve() {
      if (state.previous === null || state.operator === null) {
        return;
      }
      var result = apply(state.operator, Number(state.previous), Number(state.current));
      state.current = format(result);
      state.previous = null;
      state.operator = null;
      state.overwrite = true;
    }

    function digit(value) {
      if (state.overwrite || state.current === '0') {
        state.current = value;
      } else {
        state.current += value;
      }
      state.overwrite = false;
    }

    function dot() {
      if (state.overwrite) {
        state.current = '0.';
      } else if (state.current.indexOf('.') === -1) {
        state.current += '.';
      }
      state.overwrite = false;
    }

    function operator(value) {
      if (!state.overwrite) {
        resolve();
      }
      state.previous = state.current;
      state.operator = value;
      state.overwrite = true;
    }

    function percent() {
      state.current = format(Number(state.current) / 100);
      state.overwrite = false;
    }

    function equals() {
      resolve();
      state.overwrite = true;
    }

    function backspace() {
      if (state.overwrite) {
        state.current = '0';
      } else if (state.current.length > 1) {
        state.current = state.current.slice(0, -1);
        if (state.current === '-') {
          state.current = '0';
        }
      } else {
        state.current = '0';
      }
      state.overwrite = false;
    }

    function clear() {
      state.current = '0';
      state.previous = null;
      state.operator = null;
      state.overwrite = false;
    }

    return {
      digit: digit,
      dot: dot,
      operator: operator,
      percent: percent,
      equals: equals,
      backspace: backspace,
      clear: clear,
      get display() {
        return state.current;
      }
    };
  }

  function keyAction(key) {
    if (key >= '0' && key <= '9') {
      return { action: 'digit', value: key };
    }
    if (key === '.' || key === ',') {
      return { action: 'dot' };
    }
    if (key === '+') {
      return { action: 'operator', value: '+' };
    }
    if (key === '-' || key === '_') {
      return { action: 'operator', value: '-' };
    }
    if (key === '*' || key === 'x' || key === 'X') {
      return { action: 'operator', value: '*' };
    }
    if (key === '/') {
      return { action: 'operator', value: '/' };
    }
    if (key === '%') {
      return { action: 'percent' };
    }
    if (key === 'Enter' || key === '=') {
      return { action: 'equals' };
    }
    if (key === 'Escape' || key === 'c' || key === 'C') {
      return { action: 'clear' };
    }
    if (key === 'Backspace') {
      return { action: 'backspace' };
    }
    return null;
  }

  function bind(root) {
    var doc = root.ownerDocument;
    var display = root.querySelector('[data-display]');
    var calculator = createCalculator();

    function render() {
      var text = calculator.display;
      display.textContent = text;
      display.style.setProperty('--display-scale', String(fitScale(text)));
    }

    function activate(action, value) {
      if (!action) {
        return;
      }
      if (action === 'digit') {
        calculator.digit(value);
      } else if (action === 'dot') {
        calculator.dot();
      } else if (action === 'operator') {
        calculator.operator(value);
      } else if (action === 'percent') {
        calculator.percent();
      } else if (action === 'equals') {
        calculator.equals();
      } else if (action === 'backspace') {
        calculator.backspace();
      } else if (action === 'clear') {
        calculator.clear();
      }
      render();
    }

    function onClick(event) {
      var button = event.target.closest ? event.target.closest('[data-action]') : null;
      if (!button || !root.contains(button)) {
        return;
      }
      activate(button.getAttribute('data-action'), button.getAttribute('data-value'));
    }

    function onKeyDown(event) {
      if (event.key === ' ' && event.target && event.target.tagName === 'BUTTON') {
        return;
      }
      if (event.key === 'Enter' && event.target && event.target.tagName === 'BUTTON') {
        return;
      }
      var mapped = keyAction(event.key);
      if (!mapped) {
        return;
      }
      event.preventDefault();
      activate(mapped.action, mapped.value);
    }

    root.addEventListener('click', onClick);
    doc.addEventListener('keydown', onKeyDown);
    render();

    return { calculator: calculator, render: render, activate: activate, onKeyDown: onKeyDown };
  }

  function mount(doc) {
    var root = doc.querySelector('[data-calculator]');
    if (!root) {
      return null;
    }
    return bind(root);
  }

  var api = {
    createCalculator: createCalculator,
    format: format,
    fitScale: fitScale,
    keyAction: keyAction,
    bind: bind,
    mount: mount
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        mount(document);
      });
    } else {
      mount(document);
    }
  }
})();
