%{
var rpnList = [];
%}
%lex
%options case-insensitive

%%

'SELECT' return 'SELECT'
'FROM'	 return 'FROM'
'WHERE'  return 'WHERE'
'LIMIT'  return 'LIMIT'
'ORDER'	 return 'ORDER'
'BY'	 return 'BY'
'ASC'	 return 'ASC'
'DESC'	 return 'DESC'
'||'	 return 'OR'
'&&'	 return 'AND'
'>'		 return 'GT'
'>='	 return 'GTE'
'<'		 return 'LT'
'<=' 	 return 'LTE'
'='		 return 'EQ'
'!='	 return 'NQ'
'('		 return '('
')'		 return ')'
','		 return ','

(\d*[.])?\d+[eE]\d+						return 'NUMBER'
(\d*[.])?\d+							return 'NUMBER'

(['](\\.|[^']|\\\')*?['])+              return 'STRING'
(["](\\.|[^"]|\\\")*?["])+              return 'STRING'
'*'									    return 'STAR'
';'												return 'SEMICOLON'
[A-Za-z][A-Za-z0-9_]*    				return 'NAME'


\s+                                             /* skip whitespace */
[ \t\n]         								/* white space */
<<EOF>>               					return 'EOF'
.                     					return 'INVALID'

/lex

%left OR
%left AND
%left GT GTE LT LTE NQ EQ

%ebnf
%start stmt_list
%%

stmt_list: 
	| stmt SEMICOLON EOF {return rpnList; }
	| stmt_list SEMICOLON EOF {return rpnList; }
	;

stmt: select_stmt { rpnList.push({op: 'STMT'}); }
	;

select_stmt: SELECT select_opts select_expr_list FROM table_references opt_where opt_orderby opt_limit
			{ rpnList.push({op: 'SELECT', args: [$2, $3]});  }
			;

select_opts: { $$ = 0; };

opt_where: 
	| WHERE expr { rpnList.push({op: 'WHERE', args: []}); }
	;

select_expr_list: select_expr { $$ = 1; }
	| select_expr_list ',' select_expr { $$ = $1 + 1; }
	| '*' { rpnList.push({op: 'SELECTALL'}); $$ = 1; }
	;

table_references: table_reference { $$ = 1; }
	| table_reference ',' table_reference { $$ = $1 + 1; }
	;

table_reference: table_factor;


table_factor: 
	| NAME { rpnList.push({op: 'TABLE', args: [$1]}); }
	| NAME '.' NAME { rpnList.push({op: 'TABLE', args: [$1, $3]}); }
	;

opt_orderby: 
	| ORDER BY groupby_list { rpnList.push({op: 'ORDERBY', args: [$3]}); }
	;

groupby_list: expr opt_asc_desc { rpnList.push({op: 'GROUPBY', args: [$2]}); $$ = 1;}
	| groupby_list ',' expr opt_asc_desc {rpnList.push({op: 'GROUPBY', args: [$4]}); $$ = $1 + 1;}
	;

opt_asc_desc: {$$ = 0;}
	| ASC {$$ = 0;}
	| DESC {$$ = 1;}
	;

opt_limit: | LIMIT expr { rpnList.push({op: 'LIMIT', args: [$1]}); }
	| LIMIT expr ',' expr { rpnList.push({op: 'LIMIT', args: [$2, $3]});  }
	;

select_expr: expr ;

expr: NAME { rpnList.push({op: 'NAME', args: [$1]}); }
	| NAME '.' NAME { rpnList.push({op: 'NAME', args: [$1, $3]}); }
	| STRING { rpnList.push({op: 'STRING', args: [$1]}); }
	| NUMBER { rpnList.push({op: 'NUMBER', args: [$1]}); }
	| STAR { rpnList.push({op: 'STAR', args: []}); }
	| expr NQ expr {rpnList.push({op: 'NQ'});}
	| expr EQ expr {rpnList.push({op: 'EQ'});}
	| expr GT expr {rpnList.push({op: 'GT'});}
	| expr GTE expr {rpnList.push({op: 'GTE'});}
	| expr LT expr {rpnList.push({op: 'LT'});}
	| expr LTE expr {rpnList.push({op: 'LTE'});}
	| expr OR expr {rpnList.push({op: 'OR'}); }
	| expr AND expr {rpnList.push({op: 'AND'});}
	| '(' expr AND expr ')' {rpnList.push({op: 'AND'});}
	| '(' expr OR expr ')' {rpnList.push({op: 'OR'});}
	;