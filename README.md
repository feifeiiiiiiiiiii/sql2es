# sql2es
Use sql grammar change ES dsl

#### 目前支持语法

```

&&、||、=、!=、in、and、or、like 

eg:

1. select * from test;

2. select * from test where a = 1;

3. select * from test where a = 1 && b = 2;

4. select * from test where a = 1 && b like "Google";

5. select * from test where (a = 1 || b = 2) && c = 3;

6. select * from test where (a = 1 || b = 2) && c in (1,2,3);

7. select a,b,c from test where (a = 1 || b = 2) && c in (1,2,3);

8. select a,b,c from test where (a = 1 || b = 2) && c like_in (1,2,3);

```


#### 用法

```
var sql2es = require('sql2es');

sql2es('select * from test;', function(err, q) {
  console.log(err, q);
});
```

#### [Demo](http://esql.thnuclub.com)

#### 操作符转义对照表

key  |  value
------------ | -------------
= | term
&& | must
|| | should
!= | must_not
like | query_string
like_in | query_string
and | must
or | should
in | terms
