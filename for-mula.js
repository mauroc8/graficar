
function $(q, c) {
	return (c||document).querySelector(q);
}

var canvas 		= $('canvas'),
	cx 			= canvas.getContext('2d');

var cWidth		= 600,
	cHeight		= 200,
	centro		= {x: cWidth / 2 + .5, y: cHeight / 2 + .5},
	escala		= Number($('input[name="escala"]').value) || 20;
	

function punto(x, y) {
	cx.fillRect(centro.x + x * escala, centro.y - y * escala, 1, 1);
}

function mover(x, y) {
	cx.moveTo(centro.x + x * escala, centro.y - y * escala);
}

function línea(x, y) {
	cx.lineTo(centro.x + x * escala, centro.y - y * escala);
}

function dibujar(expresión) {
	var cadena	  = expresión.cadena,
		color 	  = expresión.color,
		i, x, y, error, anterior, tmp, último;
	
	cx.strokeStyle = color || "black";
	cx.strokeWidth = 1.5;
	
	cx.beginPath();
	
	for(i = 0; i < cWidth + 2; i += 1) {
		x = (i - centro.x) / escala;
		try { y = calcular(cadena, {x: x}) }
		catch (error) {
			alert(error.message);
			console.error(error);
			return;
		}
		
		tmp = Math.abs(y * escala) <= centro.y;
		
		if(anterior) {
			línea(x, y);
		} else if(tmp && último) {
			mover(último.x, último.y);
			línea(x, y);
		}
		
		anterior = tmp;
		último = {x: x, y: y};
	}
	
	cx.stroke();
}

function ejes() {
	cx.beginPath();
	cx.moveTo(centro.x, 0);
	cx.lineTo(centro.x, cHeight);
	cx.moveTo(0, centro.y);
	cx.lineTo(cWidth, centro.y);
	cx.strokeWidth = 1;
	cx.strokeStyle = "lightgray";
	cx.stroke();
	cx.fillStyle = "gray";
	
	var resto = cWidth % escala + escala / 2;
	for(var i = 0; i < cWidth / escala; i += 1) {
		punto(centro.x - i * escala - resto, 0);
	}
	resto = cHeight % escala + escala / 2;
	for(var i = 0; i < cHeight / escala; i += 1) {
		punto(0, centro.y - i * escala - resto);
	}
}

function color_aleatorio() {
	return "#" + randomhex() + randomhex() + randomhex();
}

function randomhex() {
	var hex = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
	return hex[Math.floor(Math.random() * hex.length)] +
		   hex[Math.floor(Math.random() * hex.length)];
}

////////////////////USER//INTERFACE////////////////////////
 ////////////////////user//interface////////////////////////

var expresiones = [],
	contenedor	= $('form'),
	iFormula 	= $('input[name="formula"]'),
	iAgregar	= $('input[name="agregar"]'),
	iColor		= $('input[name="color"]'),
	iEscala		= $('input[name="escala"]'),
	lista_fn	= $('#funciones');


window.onresize = function() {
	var width = window.innerWidth,
		height = window.innerHeight;
	if(width < 300) {
		contenedor.style.width = "200px";
		canvas.width = cWidth = 200;
		centro.x = cWidth / 2 + .5;
	} else if(width < 600) {
		contenedor.style.width = "300px";
		canvas.width = cWidth = 300;
		centro.x = cWidth / 2 + .5;
	} else {
		contenedor.style.width = "600px";
		canvas.width = cWidth = 600;
		centro.x = cWidth / 2 + .5;
	}
	if(height < 200) {
		canvas.height = cHeight = 100;
		centro.y = cHeight / 2 + .5;
	} else {
		canvas.height = cHeight = 200;
		centro.y = cHeight / 2 + .5;
	}
	ejes();
	expresiones.map(dibujar);
};

window.onresize();

contenedor.addEventListener("submit", function(event) {
	event.preventDefault();
});

iColor.addEventListener("contextmenu", function(event) {
	event.preventDefault();
	iColor.value = color_aleatorio();
});

iAgregar.addEventListener("click", function() {
	var expresión = { cadena: iFormula.value, color: iColor.value };
	expresiones.push(expresión);
	dibujar(expresión);
	lista_fn.appendChild(li_expresión(expresión));
});

iEscala.addEventListener("change", function() {
	escala = Number(iEscala.value) || 20;
	window.onresize();
});

function elt(string) {
	var div = document.createElement('div');
	div.innerHTML = string;
	return div.firstChild;
}

function li_expresión(expresión) {
	//TODO: html_encode(expresión.cadena)
	var li = elt('<li style="max-width:100%;">' +
	             '<input type="text" style="max-width:100%;" value="' + (expresión.cadena) + '"> ' +
	             '<input type="color" value="' + (expresión.color) + '" ' +
	               'title="Click derecho para cambiar a un color aleatorio."> ' +
	             '<button style="color:darkred;">Borrar</button>' +
	             '</li>');
	$('input[type="text"]', li).addEventListener("change", function() {
		try {
			calcular(this.value, {x: 5});
			this.classList.remove("error");
			expresión.cadena = this.value;
			window.onresize();
		} catch(error) {
			this.classList.add("error");
		}
	});
	$('input[type="color"]', li).addEventListener("change", function() {
		expresión.color = this.value;
		window.onresize();
	});
	$('input[type="color"]', li).addEventListener("contextmenu", function(event) {
		event.preventDefault();
		expresión.color = this.value = color_aleatorio();
		window.onresize();
	});
	$('button', li).addEventListener("click", function() {
		lista_fn.removeChild(li);
		expresiones.splice(expresiones.indexOf(expresión), 1);
		window.onresize();
	});
	li.referencia = expresión;
	return li;
}
