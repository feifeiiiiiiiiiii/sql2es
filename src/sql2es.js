var Parser = require('./parser.js');
var _	   = require('underscore');
var util   = require('./util.js');

var SYMBOL = ['EQ', 'NQ', 'GT', 'GTE', 'LT', 'LTE', 'OR', 'AND', "LIKE"];

function sql2es(sql, callback) {
	var rpnList = Parser.parse(util.trans.uncomment(sql));
	console.log(rpnList);
	var stack = new util.Stack();
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
						expr = util.trans.esTermExpr(t.args[0], util.trans.value(s.args[0], s.op));
						break;
					case 'NQ':
						expr = util.trans.esNotTermExpr(t.args[0], util.trans.value(s.args[0], s.op));
						break;
					case 'GT':
						expr = util.trans.esRangeExpr(t.args[0], util.trans.value(s.args[0], s.op), 'gt');
						break;
					case 'LT':
						expr = util.trans.esRangeExpr(t.args[0], util.trans.value(s.args[0], s.op), 'lt');
						break;
					case 'GTE':
						expr = util.trans.esRangeExpr(t.args[0], util.trans.value(s.args[0], s.op), 'gte');
						break;
					case 'LTE':
						expr = util.trans.esRangeExpr(t.args[0], util.trans.value(s.args[0], s.op), 'lte');
						break;
					case 'LIKE':
						expr = util.trans.esQueryStringExpr(t.args[0], s.args[0], 'like');
						break;
					case 'AND':
						expr = util.trans.esMustExpr(t.expr, s.expr);
						break;
					case 'OR':
						expr = util.trans.esShouldExpr(t.expr, s.expr);
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
							item2 = stack.pop();
							if (item2.op == 'STAR') {
								break;
							} else {
								if (q._source) {
									q._source.push(item2.args[0]);
								} else {
									q._source = [item2.args[0]];
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
			} else if(rpn.op == 'IN') {
				var len = rpn.args[0];
				var iter = 0;
				var vals = [];
				while (iter < len) {
					if (!stack.isEmpty()) {
						var item2 = stack.pop();
						vals.push(util.trans.value(item2.args[0], item2.op));
					}
					iter++;
				}
				if (!stack.isEmpty()) {
					var item2 = stack.pop();
					expr = util.trans.esTermsExpr(item2.args[0], vals);
					stack.push({expr: expr});
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
