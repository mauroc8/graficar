function calcular( expresión, variables ) {
	// Aquí se limpia la expresión, borrando paréntesis innecesaros.
	expresión = expresión.trim();
	if( /^\(/.test(expresión) && /\)$/.test(expresión) &&
	   findClosure(expresión) == expresión.length-1 ) {
		expresión = expresión.replace(/^\(/, '').replace(/\)$/, '').trim();
	}
	
	// Si es un número, devuelve el número.
	if( expresión==="" )
		return false;
	if( !isNaN(expresión) )
		return Number(expresión);
	if( variables && variables.hasOwnProperty(expresión) )
		return variables[expresión];
	
	// Luego -ya que la expresión no es un número, se deduce que es una operación-,
	// se procede a "desintegrar" la expresión en las subexpresiones que la integran.
	var signo;
	// Operadores binarios
	if(signo = findOutsideBrackets(expresión, "\\+")) {
		return calcular( expresión.substring(0, signo), variables ) +
			   calcular( expresión.substring(signo+1), variables );
	}
	if(signo = findOutsideBrackets(expresión, "\\-")) {
		var rest = calcular( expresión.substring(0, signo), variables );
		if(rest!==false)
			return rest - calcular( expresión.substring(signo+1), variables );
	}
	if(signo = findOutsideBrackets(expresión, "\\*")) {
		return calcular( expresión.substring(0, signo), variables ) *
			   calcular( expresión.substring(signo+1), variables );
	}
	if(signo = findOutsideBrackets(expresión, "x")) {
		return calcular( expresión.substring(0, signo), variables ) *
		calcular( expresión.substring(signo+1), variables );
	}
	if(signo = findOutsideBrackets(expresión, "\\/")) {
		return calcular( expresión.substring(0, signo), variables ) /
			   calcular( expresión.substring(signo+1), variables );
	}
	if(signo = findOutsideBrackets(expresión, "\\^")) {
		var e = calcular(expresión.substring(signo+1), variables);
		if(e!==false)
			return Math.pow(calcular(expresión.substring(0,signo), variables),
			                calcular(expresión.substring(signo+1)), variables);
	}
	if(signo = findOutsideBrackets(expresión, "b")) {
		// Operador de base. Ej: ffb16 = 255.
		var num = expresión.substring(0, signo);
		try {
			num = calcular(num, variables);
		} catch(e) {};
		return fromBase(num, calcular(expresión.substring(signo+1), variables));
	}
	// Operadores unarios y funciones
	if( /^\|/.test(expresión) && /\|$/.test(expresión) ) {
		return Math.abs( calcular(expresión.replace(/^\|/, '').replace(/\|$/, ''), variables) );
	}
	if( /°$/.test(expresión) ) {
		return calcular( expresión.replace(/°$/, ''), variables ) * Math.PI / 180;
	}
	if( /\!$/.test(expresión) ) {
		var n = calcular( expresión.replace( /\!$/, ''), variables );
		if( n < 0 )
			throw new SyntaxError("[calcular] No se puede calcular el factorial de un número negativo: "+ n);
		if( n === null )
			throw new SyntaxError("[calcular] Intentando calcular el factorial de un número vacío: "+ expresión);
		if( n === 0 )
			return 1;
		var count = 1;
		for( var i = 1; i <= n; i++ ) {
			count *= i;
		}
		return count;
	}
	if( /^toDeg\(/i.test(expresión) ) {
		return calcular( expresión.replace(/^toDeg\(/i, '').replace(/\)$/, ''), variables ) * 180 / Math.PI;
	}
	if( /^log(10)?\(/i.test(expresión) ) {
		return Math.log10( calcular(expresión.replace(/^log(10)?\(/i, '').replace(/\)$/, ''), variables) );
	}
	if( /^(ln|logE)?\(/i.test(expresión) ) {
		return Math.log( calcular(expresión.replace(/^(ln|logE)?\(/i, '').replace(/\)$/, ''), variables) );
	}
	if( /^log2\(/i.test(expresión) ) {
		return Math.log2( calcular(expresión.replace(/^log2\(/i, '').replace(/\)$/, ''), variables) );
	}
	if( /^sqrt\(/i.test(expresión) ) {
		return Math.sqrt( calcular(expresión.replace(/^sqrt\(/i, '').replace(/\)$/, ''), variables) );
	}
	if( /^cbrt\(/i.test(expresión) ) {
		return calcular( expresión.replace(/^cbrt/i, '') + "^(1/3)", variables );
	}
	if( /^sin\(/i.test(expresión) ) {
		return Math.sin( calcular(expresión.replace(/^sin\(/i, '').replace(/\)$/, ''), variables) );
	}
	if( /^tan\(/i.test(expresión) ) {
		return Math.tan( calcular(expresión.replace(/^tan\(/i, '').replace(/\)$/, ''), variables) );
	}
	if( /^cos\(/i.test(expresión) ) {
		return Math.cos( calcular(expresión.replace(/^cos\(/i, '').replace(/\)$/, ''), variables) );
	}
	if( /^asin\(/i.test(expresión) ) {
		return Math.asin( calcular(expresión.replace(/^asin\(/i, '').replace(/\)$/, ''), variables) );
	}
	if( /^atan\(/i.test(expresión) ) {
		return Math.atan( calcular(expresión.replace(/^atan\(/i, '').replace(/\)$/, ''), variables) );
	}
	if( /^atan2\(/i.test(expresión) ) {
		return Math.atan2( calcular(expresión.replace(/^atan2\(/i, '').replace(/\)$/, ''), variables) );
	}
	if( /^acos\(/i.test(expresión) ) {
		return Math.acos( calcular(expresión.replace(/^acos\(/i, '').replace(/\)$/, ''), variables) );
	}
	// Constantes
	if( /^pi$/i.test(expresión) )
		return Math.PI;
	if( /^e$/i.test(expresión) )
		return Math.E;
	
	throw new SyntaxError("[calcular] Error en la expresión: " + expresión);
}

function findClosure( expresión ) {
	// it finds the index of the closure of the first opened bracket in the expression.
	// "4 + 4 / (3+3)"
	//              ^ index 12
	// "((4+4) * 2)/3"
	//            ^ index 10
	// "4+4"
	// No brackets, returns null
	

	var bracket = /\(|\)/g, count = 0, match = [];
	while( match = bracket.exec(expresión) ) {
		if( match[0] == "(" )
		   count++;
		else if( match[0] == ")" )
			count--;
		if( count == 0 )
			return match.index;
		if( count < 0 )
			throw new SyntaxError( '[findClosure] Al parecer le falta uno o varios'+
								   ' paréntesis de apertura "(" a la expresión.' );
	}
	if( count > 0 )
		// En el caso de que termine la lectura de la expresión sin encontrar un cierre.
		throw new SyntaxError( '[findClosure] Al parecer le falta(n) '+
		                       count + ' paréntesis de cierre ")" a la expresión.' );
	return null;
}

function findOutsideBrackets( expresión, caracter ) {
	var búsqueda = new RegExp('^[^\(]*?' + caracter, 'g'),
		index = 0, resultado = [];
	while(true) {
		resultado = búsqueda.exec( expresión );
		if( resultado )
			return index + búsqueda.lastIndex - 1;
		
		var closure = findClosure( expresión );
		if( closure == null ) return null;
		
		index += closure + 1;
		expresión = expresión.substring( closure+1 );
		búsqueda.lastIndex = 0;
	}
}

function fromBase(numstring, base) {
	var fullNum = "0123456789abcdefghijklmnopqrstuvwxyz";
	var res = 0, negative;
	numstring = String(numstring);
	if(/^-/.test(numstring)) {
		negative = true;
		numstring = numstring.substring(1);
	}
	for(var i=0; i<numstring.length;i++) {
		var temp = fullNum.indexOf(numstring[i]);
		if(temp>base)
			throw new SyntaxError('[fromBase:] Cannot convert '+numstring+': it is not a base '+base+' number.');
		res += temp * Math.pow(base, numstring.length-1-i);
	}
	if(negative) res = -res;
	return res;
}