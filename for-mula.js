function $(q, c) {
  return (c || document).querySelector(q)
}

var canvas = $('canvas'),
  cx = canvas.getContext('2d')

var cWidth = 600,
  cHeight = 200,
  centro = { x: cWidth / 2 + 0.5, y: cHeight / 2 + 0.5 },
  escala = Number($('input[name="escala-range"]').value) || 20

function punto(x, y) {
  cx.fillRect(centro.x + x * escala, centro.y - y * escala, 1, 1)
}

function mover(x, y) {
  cx.moveTo(centro.x + x * escala, centro.y - y * escala)
}

function línea(x, y) {
  cx.lineTo(centro.x + x * escala, centro.y - y * escala)
}

function probar(cadena) {
  try {
    leer(cadena)
    return true
  } catch (error) {
    return error
  }
}

function dibujar(expresión) {
  var cadena = expresión.cadena,
    color = expresión.color,
    i,
    x,
    y,
    error,
    anterior,
    tmp,
    último,
    parse

  cx.strokeStyle = color || 'black'
  cx.lineWidth = 1.5

  if (probar(cadena) === true) {
    parse = leer(cadena)
  } else {
    return false
  }

  cx.beginPath()

  for (i = 0; i < cWidth + 2; i += 1) {
    x = (i - centro.x) / escala
    try {
      y = evaluar(parse, { x: x })
    } catch (error) {
      console.error(error)
      console.log(parse)
      return false
    }

    tmp = Math.abs(y * escala) <= centro.y

    if (anterior) {
      línea(x, y)
    } else if (tmp && último) {
      mover(último.x, último.y)
      línea(x, y)
    }

    anterior = tmp
    último = { x: x, y: y }
  }

  cx.stroke()

  return true
}

function ejes() {
  // Grilla

  var espaciado = escala
  if (escala < 1) {
    throw new Error('La escala no puede ser menor que 1.')
  }
  while (espaciado < 5) espaciado = espaciado * 2

  var cantidad = Math.ceil(cWidth / espaciado),
    inicio = centro.x % espaciado

  cx.beginPath()
  cx.strokeStyle = 'lightgray'
  cx.lineWidth = 1

  for (var i = 0; i < cantidad; i += 1) {
    cx.moveTo(i * espaciado + inicio, 0)
    cx.lineTo(i * espaciado + inicio, cHeight)
  }

  cantidad = Math.ceil(cHeight / espaciado)
  inicio = centro.y % espaciado

  for (var i = 0; i < cantidad; i += 1) {
    cx.moveTo(0, i * espaciado + inicio)
    cx.lineTo(cWidth, i * espaciado + inicio)
  }

  cx.stroke()

  // Ejes

  cx.beginPath()
  cx.moveTo(centro.x, 0)
  cx.lineTo(centro.x, cHeight)
  cx.moveTo(0, centro.y)
  cx.lineTo(cWidth, centro.y)
  cx.strokeStyle = 'gray'
  cx.stroke()
}

function color_aleatorio() {
  return '#' + randomhex() + randomhex() + randomhex()
}

function randomhex() {
  var hex = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  ]
  return (
    hex[Math.floor(Math.random() * hex.length)] +
    hex[Math.floor(Math.random() * hex.length)]
  )
}

////////////////////USER//INTERFACE////////////////////////
////////////////////user//interface////////////////////////

var expresiones = [],
  contenedor = $('form'),
  iFormula = $('input[name="formula"]'),
  iAgregar = $('input[name="agregar"]'),
  iColor = $('input[name="color"]'),
  iEscalaR = $('input[name="escala-range"]'),
  iEscalaN = $('input[name="escala-number"]'),
  lista_fn = $('#funciones')

window.onresize = function () {
  var width = window.innerWidth,
    height = window.innerHeight
  if (width < 300) {
    contenedor.style.width = '200px'
    canvas.width = cWidth = 200
  } else if (width < 400) {
    contenedor.style.width = '300px'
    canvas.width = cWidth = 300
  } else if (width < 600) {
    contenedor.style.width = '400px'
    canvas.width = cWidth = 400
  } else {
    contenedor.style.width = '600px'

    if (width < 800) {
      canvas.width = cWidth = 600
    } else if (width < 1000) {
      canvas.width = cWidth = 800
    } else {
      canvas.width = cWidth = 1000
    }
  }

  if (height < 250) {
    canvas.height = cHeight = 100
  } else if (height > 750 && width > 400) {
    canvas.height = cHeight = 600
  } else if (height > 600 && width > 400) {
    canvas.height = cHeight = 400
  } else if (height > 500 && width > 400) {
    canvas.height = cHeight = 300
  } else {
    canvas.height = cHeight = 200
  }

  ejes()
  expresiones.map(dibujar)
  if (iFormula.value) {
    dibujar({ cadena: iFormula.value, color: iColor.value })
  }
  window.scroll(0, 0)
}

window.onresize()

contenedor.addEventListener('submit', function (event) {
  event.preventDefault()
})

iFormula.addEventListener('keyup', function (event) {
  if (this.value) {
    var res = probar(iFormula.value)
    if (res === true) {
      var expresión = { cadena: iFormula.value, color: iColor.value }
      cx.clearRect(0, 0, cWidth, cHeight)
      ejes()
      expresiones.map(dibujar)
      dibujar(expresión)
      iFormula.classList.remove('error')
    } else {
      iFormula.classList.add('error')
    }
  } else {
    cx.clearRect(0, 0, cWidth, cHeight)
    ejes()
    expresiones.map(dibujar)
    iFormula.classList.remove('error')
  }
})

iColor.addEventListener('contextmenu', function (event) {
  event.preventDefault()
  iColor.value = color_aleatorio()
  var expresión = { cadena: iFormula.value, color: iColor.value }
  cx.clearRect(0, 0, cWidth, cHeight)
  ejes()
  expresiones.map(dibujar)
  //dibujar no necesariamente termina su trabajo
  dibujar(expresión)
})

iColor.addEventListener('change', function (event) {
  var expresión = { cadena: iFormula.value, color: iColor.value }
  cx.clearRect(0, 0, cWidth, cHeight)
  ejes()
  expresiones.map(dibujar)
  //dibujar no necesariamente termina su trabajo
  dibujar(expresión)
})

iAgregar.addEventListener('click', function () {
  var res = probar(iFormula.value)
  if (res === true) {
    var expresión = { cadena: iFormula.value, color: iColor.value }
    expresiones.push(expresión)
    lista_fn.appendChild(li_expresión(expresión))
    iFormula.classList.remove('error')
    iFormula.value = ''
  } else {
    iFormula.classList.add('error')
    alert(res)
  }
})

iEscalaR.addEventListener('change', function () {
  escala = iEscalaN.value = Number(iEscalaR.value) || 20
  window.onresize()
})

iEscalaN.addEventListener('change', function () {
  escala = iEscalaR.value = Number(iEscalaN.value) || 20
  window.onresize()
})

function elt(string) {
  var div = document.createElement('div')
  div.innerHTML = string
  return div.firstChild
}

function li_expresión(expresión) {
  //TODO: html_encode(expresión.cadena)
  var li = elt(
    '<li style="max-width:100%;">' +
      '<input type="text" style="max-width:100%;" value="' +
      expresión.cadena +
      '"> ' +
      '<input type="color" value="' +
      expresión.color +
      '" ' +
      'title="Click derecho para cambiar a un color aleatorio."> ' +
      '<button style="color:darkred;">Borrar</button>' +
      '</li>',
  )
  $('input[type="text"]', li).addEventListener('keyup', function () {
    if (probar(this.value) === true) {
      this.classList.remove('error')
      expresión.cadena = this.value
      window.onresize()
    } else {
      this.classList.add('error')
    }
  })
  $('input[type="color"]', li).addEventListener('change', function () {
    expresión.color = this.value
    window.onresize()
  })
  $('input[type="color"]', li).addEventListener('contextmenu', function (
    event,
  ) {
    event.preventDefault()
    expresión.color = this.value = color_aleatorio()
    window.onresize()
  })
  $('button', li).addEventListener('click', function () {
    lista_fn.removeChild(li)
    expresiones.splice(expresiones.indexOf(expresión), 1)
    window.onresize()
  })
  li.referencia = expresión
  return li
}

// Panear (mover) el viewport usando el mouse.

var mousedown = false
var mouse = { x: 0, y: 0 }

canvas.addEventListener('mousedown', function (event) {
  mousedown = true
  mouse.x = event.clientX
  mouse.y = event.clientY
})

window.addEventListener('mousemove', function (event) {
  if (!mousedown) return

  var moveX = event.clientX - mouse.x
  var moveY = event.clientY - mouse.y

  mouse.x = event.clientX
  mouse.y = event.clientY

  centro.x += moveX
  centro.y += moveY

  window.onresize()
})

window.addEventListener('mouseup', function () {
  mousedown = false
})
