var sql2es = require('../src/sql2es.js')

sql2es('select * from test where  a = 1 && b = 2 && (c != 4  || d = 6) && e in (1,2,3) && b like_in ("百度a", "b", "c");', function(err, q) {
	console.log(err, JSON.stringify(q));
})

sql2es('select * from test where  a = 1 && b = 2 order by id desc,id2 asc;', function(err, q) {
	console.log(err, JSON.stringify(q));
})

sql2es('select * from test where  a = 1 && b = 2 limit 1,10;', function(err, q) {
	console.log(err, JSON.stringify(q));
})

