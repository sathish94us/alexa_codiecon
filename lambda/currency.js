module.exports.currencyConverter = (value, config) => {
  config = config || {};
  let { currencySymbol = 'Rp', thousandsSeparator = '.' } = config;
  let fractionCount = 0;
  let fractionSeparator = ',';
  let symbolPosition = 'front';
  let symbolSpacing = false;
  let result = 0.0;
  let afterDot, beforeDot, pattern, _ref;

  let amount = parseFloat(value);
  if (!isNaN(amount)) {
    result = amount;
  }

  result = result.toFixed(fractionCount);
  _ref = result.split('.');
  beforeDot = _ref[0];
  afterDot = _ref[1];
  pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(beforeDot)) {
    beforeDot = beforeDot.replace(pattern, '$1' + thousandsSeparator + '$2');
  }
  if (fractionCount > 0) {
    result = [beforeDot, afterDot].join(fractionSeparator);
  } else {
    result = beforeDot;
  }

  var string;
  string = [result];
  string.splice(symbolPosition === 'front' ? 0 : 1, 0, currencySymbol);
  result = string.join(symbolSpacing ? ' ' : '');

  return result;
}
