var Parser = require('./parser.js');
var _	   = require('underscore');

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

function esTermExpr(field, value) {
	var expr = {
		term: {
		}
	};
	expr.term[field] = value;
	return expr;
} 

function esNotTermExpr(field, value) {
	var expr = {
		must_not: {
			term: {

			}
		}
	};
	expr.must_not.term[field] = value;
	return expr;
}

function esRangeExpr(field, value, op) {
	var expr = {
		range: {

		}
	};
	expr.range[field] = {};
	expr.range[field][op] = value;
	return expr;
}

function esMustExpr(expr1, expr2) {
	var expr = {
		bool: {
			must: []
		}
	}
	expr.bool.must.push(expr1);
	expr.bool.must.push(expr2);
	return expr;
}

function esShouldExpr(expr1, expr2) {
	var expr = {
		bool: {
			should: []
		}
	}
	expr.bool.should.push(expr1);
	expr.bool.should.push(expr2);
	return expr;
}

var SYMBOL = ['EQ', 'NQ', 'GT', 'GTE', 'LT', 'LTE', 'OR', 'AND'];

function sql2es(sql, callback) {
	var rpnList = Parser.parse(sql);
	var stack = new Stack();
	var q = {
		query: {}
	};
	_.each(rpnList, function(rpn) {
		if (_.indexOf(SYMBOL, rpn.op) >= 0) {
			var s, t, expr;
			if (!stack.isEmpty()) {
				s = stack.pop();
			}
			if (!stack.isEmpty()) {
				t = stack.pop();
			}
			if (s && t) {
				switch(rpn.op) {
					case 'EQ':
						expr = esTermExpr(t.args[0], s.args[0]);
						break;
					case 'NQ':
						expr = esNotTermExpr(t.args[0], s.args[0]);
						break;
					case 'GT':
						expr = esRangeExpr(t.args[0], s.args[0], 'gt');
						break;
					case 'LT':
						expr = esRangeExpr(t.args[0], s.args[0], 'lt');
						break;
					case 'GTE':
						expr = esRangeExpr(t.args[0], s.args[0], 'gte');
						break;
					case 'LTE':
						expr = esRangeExpr(t.args[0], s.args[0], 'lte');
						break;
					case 'AND':
						expr = esMustExpr(t.expr, s.expr);
						break;
					case 'OR':
						expr = esShouldExpr(t.expr, s.expr);
						break;
					default:
						console.log('default');
				}
				stack.push({expr: expr});
			}
		} else {
			if (_.indexOf(['NAME', 'NUMBER', 'STRING', 'TABLE'], rpn.op) >= 0) {
				stack.push(rpn);
			} else if(rpn.op == 'STMT') {
			} else if(rpn.op == 'SELECT') {
				var len = rpn.args[1];
				if (!stack.isEmpty()) {
					var item = stack.pop();
					if (item.op == 'TABLE') {
						q.index = item.args[0];
					}
					var iter = 0;
					while (iter < len) {
						if (!stack.isEmpty()) {
							item = stack.pop();
							if (item.op == 'STAR') {
								break;
							} else {
								if (q._source) {
									q._source.push(item.args[0]);
								} else {
									q._source = [item.args[0]];
								}
							}
						}
						iter++;
					}
				}
			} else if(rpn.op == 'WHERE') {
				if (!stack.isEmpty()) {
					var item = stack.pop();
					q.query = item.expr;
				}
			}
		}
	});
	if(stack.isEmpty()) {
		return callback(null, q);
	}
	return callback("parser error");
};

module.exports = sql2es;