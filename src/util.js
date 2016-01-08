_ = require('underscore');

var Stack = function(initialCapacity) {
	var _initialCapacity = initialCapacity || Infinity;
	var _elements = [];

	function push(element) {
		if (size() === _initialCapacity) {
			throw new Error('push(): Stack is full.');
		}
		return _elements.push(element);
	}

	function pop() {
		if (isEmpty()) {
			throw new Error('pop(): Stack is empty.');
		}
		return _elements.pop();
	}

	function peek() {
		if (isEmpty()) {
			throw new Error('peek(): Stack is empty.');
		}
		return _elements[_elements.length - 1];
	}

	function isEmpty() {
		return size() === 0;
	}

	function size() {
		return _elements.length;
	}

	function empty() {
		while (_elements.length) {
			_elements.pop();
		}
	}

	function Iterator() {
		var counter = 0;

		function hasNext() {
			return _elements.length !== counter;
		}

		function next() {
			if (!hasNext()) {
				throw new Error('next(): No such element.');
			}
			return _elements[_elements.length - 1 - counter++];
		}
		return {
			hasNext: hasNext,
			next: next
		};
	}

	return {
		push: push,
		pop: pop,
		peek: peek,
		isEmpty: isEmpty,
		size: size,
		empty: empty,
		iterator: new Iterator()
	};
};

function convert(literal) {
    var result = literal.substring(1, literal.length - 1);
    result = result.replace(/"/g, '');
    return result;
}

var trans = {
	uncomment: function(str) {
		// Add some padding so we can always look ahead and behind by two chars
		str = ('__' + str + '__').split('');
		var quote = false,
			quoteSign,
			// regularExpression = false,
			// characterClass = false,
			blockComment = false,
			lineComment = false;
			// preserveComment = false;

		for (var i = 0, l = str.length; i < l; i++) {

			// When checking for quote escaping, we also need to check that the
			// escape sign itself is not escaped, as otherwise '\\' would cause
			// the wrong impression of an unclosed string:
			var unescaped = str[i - 1] !== '\\' || str[i - 2] === '\\';

			if (quote) {
				if (str[i] === quoteSign && unescaped){
					quote = false;
				}

			} else if (blockComment) {
				// Is the block comment closing?
				if (str[i] === '*' && str[i + 1] === '/') {
					// if (!preserveComment)
						str[i] = str[i + 1] = '';
					blockComment /* = preserveComment*/ = false;
					// Increase by 1 to skip closing '/', as it would be mistaken
					// for a regexp otherwise
					i++;
				} else { //if (!preserveComment) {
					str[i] = '';
				}
			} else if (lineComment) {
				// One-line comments end with the line-break
				if (str[i + 1] === '\n' || str[i + 1] === '\r'){
					lineComment = false;
				}
				str[i] = '';
			} else {
				if (str[i] === '"' || str[i] === "'") {
					quote = true;
					quoteSign = str[i];
				} else if (str[i] === '[' && str[i-1] !== "@") {
					quote = true;
					quoteSign = ']';
				// } else if (str[i] === '-' &&  str[i + 1] === '-') {
				// 	str[i] = '';
				// 	lineComment = true;
				} else if (str[i] === '/' && str[i + 1] === '*') {
						// Do not filter out conditional comments /*@ ... */
						// and comments marked as protected /*! ... */

						str[i] = '';
						blockComment = true;

				}
			}
		}
		// Remove padding again.
		str = str.join('').slice(2, -2);

		return str;
	},
	value: function(value, type) {
		if (type == 'NUMBER') return +value;
		return convert(value);
	},
	esTermExpr: function(field, value) {
		var expr = {
			term: {
			}
		};
		expr.term[field] = value;
		return expr;
	},
	esTermsExpr: function(field, value) {
		var expr = {
			terms: {
			}
		};
		expr.terms[field] = value;
		return expr;
	},
	esNotTermExpr: function(field, value) {
		var expr = {
			must_not: {
				term: {
				}
			}
		};
		expr.must_not.term[field] = value;
		return {bool: expr};
	},

	esRangeExpr: function(field, value, op) {
		var expr = {
			range: {

			}
		};
		expr.range[field] = {};
		expr.range[field][op] = value;
		return expr;
	},

	esMustExpr: function(expr1, expr2) {
		var expr = {
			bool: {
				must: []
			}
		}
		expr.bool.must.push(expr1);
		expr.bool.must.push(expr2);
		return expr;
	},

	esShouldExpr: function(expr1, expr2) {
		var expr = {
			bool: {
				should: []
			}
		}
		expr.bool.should.push(expr1);
		expr.bool.should.push(expr2);
		return expr;
	},
	esQueryStringExpr: function(field, value) {
		var expr = {
			query_string: {
				default_field: field
			}
		}
		expr.query_string.query = convert(value);
		return expr;
	},
    esQueryStringInExpr: function(field, value) {
		var expr = {
			query_string: {
				default_field: field
			}
		}
		expr.query_string.query = _.each(value, function(o) { o = convert(o); }).join(' OR ');
		return expr;
	}
}

module.exports.Stack = Stack;
module.exports.trans = trans;
