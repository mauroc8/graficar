// Lector de expresiones aritméticas

// En nuestro caso no permitimos ningún otro nombre de variable.

var VARIABLES_PERMITIDAS = 'x'

function leer(cadena, índice) {
  índice = índice || 0

  var cursor = 0,
    operadores = '+-*/^', //se refiere a los binarios
    funciones = [
      'sen',
      'cos',
      'tan',
      'log',
      'ln',
      'abs',
      'sqrt',
      'asen',
      'acos',
      'atan',
    ],
    constantes = { π: Math.PI, e: Math.E },
    resultado = {
      tipo: 'expresión',
      expresión: [],
      posición: índice,
    },
    tabla_precedencia = [
      { cadena: '^', binario: true, asocia: 'derecha' },
      { cadena: '.', binario: true, asocia: 'derecha' }, //representa multiplicación, para uso interno exclusivamente
      {
        cadena: 'sen|cos|tan|log|ln|abs|sqrt|asen|acos|atan',
        binario: false,
        asocia: 'derecha',
      },
      {
        cadena: '-',
        binario: false,
        asocia: 'izquierda' /* derecha tambien funciona */,
      },
      { cadena: '*/', binario: true, asocia: 'izquierda' },
      { cadena: '+-', binario: true, asocia: 'izquierda' },
    ],
    espacio = function () {
      while (cadena[cursor] === ' ') {
        cursor += 1
      }
      return true
    },
    operador = function (buscar) {
      espacio()

      if (
        buscar ? cadena[cursor] === buscar : operadores.includes(cadena[cursor])
      ) {
        resultado.expresión.push({
          tipo: 'función',
          función: cadena[cursor],
          binario: !buscar,
        })
        cursor += 1
        return true
      } else {
        return false
      }
    },
    expresión = function () {
      espacio()
      var cierre, subexpr, i

      if (cadena[cursor] === '(') {
        cierre = cierre_paréntesis(cadena.substr(cursor))
        error(cierre === false, 'Paréntesis sin cerrar.')
        subexpr = cadena.substr(cursor + 1, cierre - 1)
        resultado.expresión.push(leer(subexpr, cursor + 1 + índice))
        cursor += 1 + cierre
        return true
      } else if (
        (subexpr = cadena.substr(cursor).match(/^[0-9\.]+ *[a-zπ]?/))
      ) {
        subexpr = subexpr[0]

        var letra = subexpr.replace(/^[0-9\.]+ */, ''),
          número = Number(subexpr.replace(/ *[a-zπ]?$/, '')),
          tmp

        if (número && letra) {
          if (constantes.hasOwnProperty(letra)) {
            tmp = { tipo: 'número', número: constantes[letra] }
          } else {
            error(
              !VARIABLES_PERMITIDAS.includes(letra),
              'Nombre de variable no permitido.',
            )
            tmp = { tipo: 'variable', variable: letra }
          }

          resultado.expresión.push(
            { tipo: 'número', número: número },
            { tipo: 'función', función: '.', binario: true },
            tmp,
          )
        } else if (número === número) {
          resultado.expresión.push({
            tipo: 'número',
            número: número,
          })
        } else {
          error(true, 'Error leyendo valor numérico.')
        }
        cursor += subexpr.length
        return true
      }

      for (i = 0; i < funciones.length; i += 1) {
        if (cadena.indexOf(funciones[i], cursor) === cursor) {
          resultado.expresión.push({
            tipo: 'función',
            función: funciones[i],
            binario: false,
          })
          cursor += funciones[i].length
          // Todavía nos queda leer
          // el argumento con el que se llama la función.
          return expresión()
        }
      }

      // La función valor absoluto se trata de manera separada:

      if (cadena[cursor] === '|') {
        error(
          !cadena.includes('|', cursor + 1),
          'Función de valor absoluto sin cerrar.',
        )

        subexpr = cadena.substring(cursor + 1, cadena.indexOf('|', cursor + 1))

        resultado.expresión.push({
          tipo: 'función',
          función: 'abs',
          binario: false,
        })
        resultado.expresión.push(leer(subexpr, cursor + 1 + índice))
        cursor += subexpr.length + 2
        return true
      }

      // Constantes

      if (constantes.hasOwnProperty(cadena[cursor])) {
        resultado.expresión.push({
          tipo: 'número',
          número: constantes[cadena[cursor]],
        })
        cursor += 1
        return true
      }

      if (cadena[cursor].match(/[a-z]/)) {
        error(
          !VARIABLES_PERMITIDAS.includes(cadena[cursor]),
          'Nombre de variable no permitido.',
        )
        resultado.expresión.push({
          tipo: 'variable',
          variable: cadena[cursor],
        })
        cursor += 1
        return true
      }

      return false
    },
    error = function (bool, mensaje) {
      if (bool) {
        var e = new SyntaxError(
          mensaje + ' en la posición ' + (cursor + índice) + '.',
        )
        throw e
      }
    },
    aplicar_precedencia = function (objeto) {
      // Modifica al objeto en-el-lugar.
      var i, j, operador, tipo, buscar, elemento, cabeza, cola, subexpr

      if (objeto.tipo === 'expresión') {
        for (i = 0; i < tabla_precedencia.length; i += 1) {
          precede = tabla_precedencia[i]

          if (precede.asocia === 'izquierda') {
            for (j = 0; j < objeto.expresión.length; j += 1) {
              elemento = objeto.expresión[j]
              if (
                elemento.tipo === 'función' &&
                elemento.binario === precede.binario &&
                precede.cadena.includes(elemento.función)
              ) {
                if (precede.binario) {
                  cabeza = objeto.expresión[j - 1]
                  cola = objeto.expresión[j + 1]
                  subexpr = {
                    tipo: 'expresión',
                    expresión: [cabeza, elemento, cola],
                  }
                  objeto.expresión.splice(j - 1, 3, subexpr)
                } else {
                  cola = objeto.expresión[j + 1]
                  subexpr = { tipo: 'expresión', expresión: [elemento, cola] }
                  objeto.expresión.splice(j, 2, subexpr)
                }

                j -= 1
              }
            }
          } else if (precede.asocia === 'derecha') {
            for (j = objeto.expresión.length - 1; j >= 0; j -= 1) {
              elemento = objeto.expresión[j]
              if (
                elemento.tipo === 'función' &&
                elemento.binario === precede.binario &&
                precede.cadena.includes(elemento.función)
              ) {
                if (precede.binario) {
                  cabeza = objeto.expresión[j - 1]
                  cola = objeto.expresión[j + 1]
                  subexpr = {
                    tipo: 'expresión',
                    expresión: [cabeza, elemento, cola],
                  }
                  objeto.expresión.splice(j - 1, 3, subexpr)
                } else {
                  cola = objeto.expresión[j + 1]
                  subexpr = { tipo: 'expresión', expresión: [elemento, cola] }
                  objeto.expresión.splice(j, 2, subexpr)
                }

                if (precede.binario) {
                  j -= 1
                }
              }
            }
          }
        }
      }

      return objeto
    }

  // Opcional: operador unario de negación.
  // SOLAMENTE al principio de una expresión/subexpresión (entre paréntesis).
  operador('-')
  error(expresión() === false, 'Se esperaba una expresión.')
  while (operador()) {
    error(expresión() === false, 'Se esperaba una expresión.')
  }

  error(cursor < cadena.length, 'Basura al final de la cadena.')

  aplicar_precedencia(resultado)

  if (resultado.expresión.length === 1) {
    return resultado.expresión[0]
  }

  return resultado
}

function cierre_paréntesis(cadena) {
  var abierto = false,
    nivel = 0
  for (var i = 0; i < cadena.length; i += 1) {
    if (cadena[i] === '(') {
      abierto = true
      nivel += 1
    } else if (cadena[i] === ')') {
      nivel -= 1
    }

    if (abierto && nivel === 0) {
      return i
    }
  }
  return false
}

// MDN String.prototype.includes() polyfill
if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    'use strict'
    if (typeof start !== 'number') {
      start = 0
    }

    if (start + search.length > this.length) {
      return false
    } else {
      return this.indexOf(search, start) !== -1
    }
  }
}

var evaluar = (function () {
  // La función se llama a sí misma y devuelve otra función.

  var binarios = {
    '^': function (a, b) {
      return Math.pow(a, b)
    },
    '*': function (a, b) {
      return a * b
    },
    '/': function (a, b) {
      return a / b
    },
    '+': function (a, b) {
      return a + b
    },
    '-': function (a, b) {
      return a - b
    },
    '.': function (a, b) {
      return a * b
    },
  }

  var unarios = {
    // se refiere a unarios
    sen: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    abs: Math.abs,
    log: function (a) {
      return Math.log(a) / Math.LN10
    },
    ln: Math.log,
    sqrt: Math.sqrt,
    asen: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    '-': function (a) {
      return -a
    },
  }

  function evaluar(objeto, variables) {
    var expresión, a, fn, b

    if (objeto.tipo === 'expresión') {
      expresión = objeto.expresión
      switch (expresión.length) {
        case 3:
          a = evaluar(expresión[0], variables)
          fn = binarios[expresión[1].función]
          b = evaluar(expresión[2], variables)
          return fn(a, b)
          break
        case 2:
          fn = unarios[expresión[0].función]
          a = evaluar(expresión[1], variables)
          return fn(a)
          break
        case 1:
          return expresión[0]
          break
        default:
          throw new Error('Error en la expresión (2).')
          break
      }
    }
    if (objeto.tipo === 'número') {
      return objeto.número
    }
    if (objeto.tipo === 'variable') {
      if (variables.hasOwnProperty(objeto.variable)) {
        return variables[objeto.variable]
      } else {
        throw new Error('Error en la expresión: variable desconocida (3).')
      }
    }

    throw new Error('Error en la expresión (1).')
  }

  return evaluar
})()
