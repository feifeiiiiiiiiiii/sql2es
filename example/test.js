var sql2es = require('../src/sql2es.js')

sql2es('select * from test;', function(err, q) {
	console.log(err, q);
})

sql2es('select a,b from test;', function(err, q) {
	console.log(err, q);
})

sql2es('select * from test where a = 1;', function(err, q) {
	console.log(err, q);
})

sql2es('select * from test where a = 1 && b = 2;', function(err, q) {
	console.log(err, JSON.stringify(q));
})

sql2es('select * from test where (a = 1 || b = 2) && c = 3;', function(err, q) {
	console.log(err, JSON.stringify(q));
})

sql2es('select * from test where (a = 1 || b = 2) && (c = 3 || d = 4);', function(err, q) {
	console.log(err, JSON.stringify(q));
})

sql2es('select * from test where (a = 1 || b > 2) && (c = 3 || d = 4);', function(err, q) {
	console.log(err, JSON.stringify(q));
})

sql2es('select * from test where a = 1 || b > 2 && (c = 3 || d = 4);', function(err, q) {
	console.log(err, JSON.stringify(q));
})
