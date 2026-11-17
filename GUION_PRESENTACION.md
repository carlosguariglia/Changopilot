# Guion de estudio para presentar Changopilot

## 1. Idea central para abrir la presentación

> **La inteligencia artificial puede acelerar la producción de código, pero no reemplaza el criterio técnico ni la responsabilidad profesional.**

Changopilot propone una situación concreta: la IA entrega código que parece correcto y el estudiante debe revisarlo antes de que llegue a producción. La aplicación no presenta a la IA como una autoridad infalible, sino como una herramienta que debe ser dirigida, verificada y auditada.

Para explicar el modelo de trabajo del proyecto, podemos usar una metáfora de equipo:

> **Carlos Guariglia es el Team Leader y la IA actúa como Junior.** Carlos asigna la tarea, guía el trabajo, revisa la propuesta, corrige lo necesario y decide si está lista. La IA genera rápido, pero no entrega el trabajo final directamente al cliente.

La metáfora que organiza la relación entre ambos roles es:

> “La IA es como un empleado junior muy veloz: recibe una tarea, produce una propuesta y puede cometer errores. Yo soy el Team Leader: debo entender el pedido, revisar el resultado, probarlo y hacerme responsable de lo que finalmente se entrega.”

Esto modifica el rol tradicional del desarrollador. Ya no alcanza con escribir toda la sintaxis manualmente: el profesional debe saber **formular el problema, leer una solución, detectar riesgos, probarla, decidir si sirve y explicar sus consecuencias**.

## 2. Presentación breve del proyecto

**Changopilot — IA: ¿Copiloto o Chango Automático?** es una dinámica interactiva de *Live Code Review* para estudiantes de la Tecnicatura Superior en Análisis de Sistemas del ISFT 151.

Los participantes ingresan desde sus celulares, observan el código en la pantalla del proyector y responden preguntas de opción múltiple. En cada ronda auditan un supuesto entregable generado por una IA. Luego se revela la respuesta, se explica el error, se muestra una mejora cuando corresponde y se obtiene una moraleja relacionada con el trabajo profesional.

El objetivo no es memorizar errores aislados, sino practicar un método:

1. Entender qué problema debía resolver el código.
2. Leer el código paso a paso.
3. Preguntar qué ocurre en casos normales y excepcionales.
4. Considerar recursos, seguridad, mantenimiento y concurrencia.
5. Probar o razonar la respuesta antes de aceptarla.
6. Asumir la responsabilidad de la decisión final.

## 3. Guion oral sugerido, en orden

### A. Problema y motivación

“La IA generativa permite obtener código en segundos. El riesgo aparece cuando confundimos velocidad con corrección. Un código puede compilar, tener buena apariencia o resolver el caso feliz y, aun así, fallar en producción.”

“Por eso diseñé Changopilot como una experiencia de auditoría. El estudiante no compite por escribir más rápido: compite por detectar una trampa, justificarla y pensar qué consecuencias tendría.”

### B. Qué cambia en el rol del desarrollador

“Con IA, el desarrollador pasa de ser solamente productor de líneas de código a ser también Team Leader: especifica, dirige, revisa, integra y asume la responsabilidad. En este proyecto, Carlos ocupa ese rol y la IA actúa como Junior. La IA propone; el Team Leader valida.”

“La pregunta importante ya no es solamente ‘¿la IA pudo escribirlo?’, sino:

- ¿Entendemos qué hace?
- ¿Cumple el requerimiento real?
- ¿Qué supuestos está haciendo?
- ¿Qué pasa ante errores, datos maliciosos o muchos usuarios?
- ¿Se puede mantener y modificar?
- ¿Cómo demostramos que funciona?”

### C. Cómo funciona la dinámica

1. El presentador abre la vista **Host/Proyector** con `?host=true` e ingresa la clave.
2. La pantalla muestra un QR y una URL para que se conecten los participantes.
3. Cada estudiante ingresa un alias y su año.
4. Hay una ronda de práctica sin puntaje para explicar la mecánica.
5. Comienzan las seis rondas puntuables.
6. En cada ronda se muestra el prompt que supuestamente recibió la IA, el código, una pregunta y cuatro opciones.
7. El estudiante analiza y vota desde el celular antes de que termine el tiempo.
8. El host cierra la ronda manualmente o cuando finaliza el temporizador.
9. Se muestran los votos, la respuesta correcta, la explicación, la moraleja y el ranking.
10. Al finalizar aparece el podio y cada participante puede descargar/imprimir un resumen de aprendizaje.

Una frase útil para explicar la interacción es:

> “El celular funciona como interfaz de respuesta y el proyector como espacio común de análisis y discusión.”

## 4. Las seis rondas y su base teórica

### Ronda 1 — Algoritmos: instrucción vacía en un `while`

Código:

```cpp
int pedido = 1;
while (pedido <= 10); {
    procesar(pedido);
    pedido++;
}
```

**Respuesta:** queda en un bucle infinito y el bloque no se ejecuta.

**Base teórica:** en C++, el punto y coma puede ser una instrucción vacía. El `while` controla solamente esa instrucción vacía; las llaves forman un bloque posterior, independiente del ciclo.

**Qué demuestra:** no alcanza con reconocer visualmente la intención del código. Hay que seguir la sintaxis real y, si es posible, ejecutar o probar el comportamiento.

**Cómo explicarlo oralmente:** “El error es pequeño visualmente, pero cambia completamente el flujo de control. Una revisión superficial puede dejar pasar un sistema bloqueado.”

### Ronda 2 — Gestión de memoria: *memory leak*

Código:

```cpp
void generarReporte() {
    int* buffer = new int[10000];
    cargarDatos(buffer);
    if (huboError()) return;
    delete[] buffer;
}
```

**Respuesta:** cada retorno temprano deja memoria reservada sin liberar.

**Base teórica:** `new[]` reserva memoria dinámica y `delete[]` debe liberarla. El `return` salta el `delete[]`. En un proceso de larga duración, las fugas acumuladas pueden degradar el sistema o agotar la memoria.

**Mejora conceptual:** usar RAII y estructuras administradas, por ejemplo `std::vector<int>` o `std::unique_ptr<int[]>`, para que la liberación esté vinculada al ciclo de vida del objeto.

**Cómo explicarlo oralmente:** “La IA resolvió la reserva, pero no auditó todos los caminos de salida. El auditor debe buscar recursos que queden abiertos, reservados o bloqueados cuando ocurre un error.”

### Ronda 3 — POO: polimorfismo y despacho dinámico

Código relevante:

```cpp
class Notificacion {
public:
    void enviar() { cout << "Generica\n"; }
};

class Email : public Notificacion {
public:
    void enviar() { cout << "Enviando Email\n"; }
};

Notificacion* n = new Email();
n->enviar();
```

**Respuesta:** imprime `Generica`, porque falta `virtual` en la clase base.

**Base teórica:** el polimorfismo permite usar una interfaz común y que cada implementación responda de manera diferente. En C++, el método de la clase base debe ser virtual para que el despacho se resuelva según el tipo real del objeto cuando se usa un puntero o referencia a la base.

**Observación adicional para demostrar criterio:** en código real también convendría revisar el destructor virtual de la clase base si se van a destruir objetos derivados mediante un puntero base.

**Cómo explicarlo oralmente:** “La herencia sola no garantiza polimorfismo. Hay que comprobar qué comportamiento se selecciona en tiempo de ejecución.”

### Ronda 4 — SQL: condición siempre verdadera

Código:

```sql
DELETE FROM pedidos
WHERE estado = 'CANCELADO' OR 1 = 1;
```

**Respuesta:** borra todos los registros.

**Base teórica:** `1 = 1` siempre es verdadero. En una expresión con `OR`, basta con que una parte sea verdadera para que toda la condición lo sea.

**Controles profesionales que faltan:** revisar el `WHERE`, ejecutar primero un `SELECT` equivalente, usar transacciones, limitar permisos y contar filas afectadas antes de confirmar una operación destructiva.

**Cómo explicarlo oralmente:** “Una respuesta de IA puede ser sintácticamente válida y operacionalmente peligrosa. La auditoría debe evaluar el impacto, no solamente si la consulta compila.”

### Ronda 5 — Arquitectura: principio Abierto/Cerrado

Código resumido:

```javascript
class CarritoDeCompras {
  pagar(metodo, monto) {
    if (metodo === "EFECTIVO") { /* ... */ }
    else if (metodo === "TARJETA") { /* ... */ }
    else if (metodo === "MERCADOPAGO") { /* ... */ }
  }
}
```

**Respuesta:** funciona hoy, pero acopla el carrito a cada medio de pago y obliga a modificar el núcleo para cada caso nuevo.

**Base teórica:** el principio Abierto/Cerrado indica que una parte del sistema debería estar abierta a extensiones, pero cerrada a modificaciones innecesarias. El patrón Strategy permite encapsular cada medio de pago detrás de una operación común, por ejemplo `pagar(monto)`.

**Qué debe aclararse:** no todo `if` es un error. El problema es que una clase central conoce demasiados detalles y crece cada vez que aparece una variante.

**Cómo explicarlo oralmente:** “La solución de la IA puede funcionar en una demo, pero una auditoría también evalúa el costo del próximo cambio y el riesgo de romper lo que ya funciona.”

### Ronda 6 — Concurrencia: *race condition*

Código:

```javascript
async function reservarAsiento(salaId) {
  const libres = await db.contarLibres(salaId);
  if (libres > 0) {
    await db.ocuparAsiento(salaId);
    return "Reservado";
  }
}
```

**Respuesta:** dos usuarios pueden leer que queda un asiento y ambos intentar reservarlo.

**Base teórica:** hay una condición de carrera porque la lectura y la actualización no forman una única operación atómica. El resultado depende del orden de intercalación de dos solicitudes concurrentes.

**Soluciones posibles:** transacción con bloqueo o aislamiento adecuado, operación atómica en la base, restricción única o actualización condicionada que devuelva cuántas filas se modificaron.

**Cómo explicarlo oralmente:** “El código puede funcionar en una prueba con un usuario. El análisis profesional pregunta qué ocurre cuando dos acciones llegan casi al mismo tiempo.”

## 5. Arquitectura y funcionamiento interno

### Estado y máquinas de fase

La aplicación mantiene un objeto `state` con la conexión, los jugadores, los votos, el puntaje, el temporizador y la fase actual:

- `LOBBY`: ingreso y espera.
- `QUESTION`: pregunta activa y recepción de votos.
- `REVEAL`: explicación, resultados y ranking.
- `PODIUM`: clasificación final.
- `CLOSING`: cierre de la actividad.

Este enfoque hace explícito el flujo de la experiencia y evita mezclar la lógica de una ronda con la de otra.

### Dos roles de interfaz

- **Host:** vista del proyector, controla la ronda, revela respuestas, modera jugadores y muestra rankings.
- **Student:** vista móvil, permite ingresar, leer el código, votar y recibir la devolución.

La misma página decide qué vista mostrar según la URL y la validación del acceso del host.

### Comunicación

Supabase Realtime se usa en modo **Broadcast**. El host publica eventos como:

- `player_join`
- `player_vote`
- `room_state`
- `kick_player`
- `join_rejected`

El host conserva la fuente principal del estado de la sala y los estudiantes se sincronizan con `room_state`. No se necesita una tabla de base de datos para guardar la partida.

### Puntaje

Una respuesta correcta obtiene:

```text
500 + una bonificación proporcional al tiempo restante
```

La práctica no suma puntos. Esto permite enseñar primero la dinámica y después evaluar.

### Resiliencia y experiencia de aula

- Si no hay conexión, existe modo offline para la vista del proyector.
- No se eliminan jugadores por inactividad: una desconexión temporal no borra su puntaje y el presentador controla la expulsión manual.
- Se evita votar más de una vez por ronda.
- Se controla la duplicación de alias.
- Se filtran alias ofensivos normalizando tildes, separadores y formas de *leetspeak*.
- Se escapan textos introducidos por usuarios antes de insertarlos en HTML.
- Al final se genera un resumen imprimible o guardable como PDF desde el navegador.

## 6. Tecnologías utilizadas

### Tecnologías propias

- **HTML5:** estructura de vistas, formularios, diálogos, código y accesibilidad básica.
- **CSS3:** diseño responsive para proyector y celulares, tarjetas, ranking y temas claro/oscuro.
- **JavaScript Vanilla:** estado, eventos, navegación, temporizadores, votación, puntaje y sincronización.

No hay `package.json`, bundler ni servidor propio: el proyecto se ejecuta como sitio estático.

### Librerías externas por CDN

- **PrismJS 1.29:** resaltado de sintaxis para C++, SQL y JavaScript.
- **QRCode.js:** generación de los QR para ingresar y para enlazar otros proyectos.
- **Supabase JS v2:** conexión con Supabase Realtime mediante Broadcast.

### Despliegue

Puede publicarse como sitio estático, por ejemplo en GitHub Pages. Para probarlo localmente:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

## 7. Decisiones que conviene defender

### ¿Por qué Vanilla JavaScript?

“La aplicación es una experiencia educativa autocontenida. Vanilla JavaScript reduce la infraestructura necesaria y deja visibles los conceptos de estado, eventos, DOM y comunicación. Para este alcance no era necesario agregar un framework ni un proceso de build.”

### ¿Por qué Supabase Broadcast y no una base de datos?

“La partida necesita transmitir eventos en vivo, no persistir una entidad compleja. Broadcast es suficiente y reduce el acoplamiento. El modo offline permite continuar si la red falla.”

### ¿Por qué hay una ronda de práctica?

“Para separar el aprendizaje de la evaluación. Primero se enseña a leer el código y votar; después se puntúan las seis auditorías.”

### ¿La aplicación usa una IA para generar las preguntas en vivo?

“No. Las preguntas están definidas como contenido curado en `questions.js`. El proyecto simula entregables de una IA para que la actividad sea reproducible, controlable y pedagógicamente consistente. La IA es el objeto de auditoría, no una dependencia impredecible de la demo.”

### ¿El filtro de alias reemplaza la moderación humana?

“No. Es una primera barrera automática, complementada por la posibilidad de expulsar desde el host. Todo filtro automático puede tener falsos positivos o negativos; por eso la decisión final sigue siendo humana.”

## 8. Límites y auditoría del propio proyecto

Este apartado es importante para demostrar que el mensaje del proyecto también se aplica a Changopilot.

- La clave del host está implementada del lado del cliente; no debe considerarse un mecanismo fuerte de autenticación para un sistema real.
- La clave pública de Supabase puede estar disponible en el navegador; la seguridad real depende de la configuración del proyecto y de sus políticas.
- El modo offline no sincroniza celulares: sirve para continuar la presentación en la pantalla del host.
- La lógica de puntaje y parte del estado viven en el navegador del host; una aplicación competitiva real necesitaría un servidor confiable.
- Las explicaciones son ejemplos pedagógicos simplificados; en producción habría que probar cada caso en su lenguaje, motor de base de datos y contexto concreto.

Frase para cerrar este punto:

> “El proyecto enseña a auditar código y también debe ser auditado: ninguna decisión técnica queda fuera de revisión por el solo hecho de estar dentro de una aplicación educativa.”

## 9. Cierre sugerido

“Changopilot no busca demostrar que la IA es buena o mala. Busca mostrar que es poderosa y que, precisamente por eso, necesita supervisión. La herramienta puede producir una primera solución, pero el desarrollador debe comprenderla, probarla, adaptarla al contexto y responder por sus consecuencias.”

> **La IA acelera el código; el criterio técnico decide si ese código merece llegar a producción.**

## 10. Preguntas posibles del jurado

### ¿Cuál es el aporte original?

La combinación de una dinámica participativa en tiempo real con situaciones de auditoría técnica. Los conceptos no se explican solamente como teoría: se convierten en decisiones que los estudiantes deben tomar y justificar.

### ¿Qué pasa si falla internet?

El host puede activar el modo offline y continuar la presentación. Para la experiencia completa con celulares se necesita conectividad, porque Supabase Realtime transporta los eventos.

### ¿Cómo se evita que un alumno vote dos veces?

La interfaz guarda la opción elegida en el estado del participante y oculta las opciones. El host también ignora votos repetidos para el mismo jugador durante la ronda.

### ¿Cómo se calculan los rankings?

Se ordenan los jugadores por puntaje y se calcula además un promedio por año, acumulando los puntajes y dividiendo por la cantidad de participantes de cada grupo.

### ¿Qué pasa si alguien entra tarde o vuelve a abrir el navegador?

El ingreso tardío empieza con puntaje 0 y participa desde la ronda que está activa, sin recuperar puntos de rondas anteriores. Si una persona cierra temporalmente el navegador y vuelve a entrar con su identificación guardada, recupera su puntaje acumulado mientras el presentador no haya expulsado manualmente al participante.

### ¿Por qué mostrar el prompt de la IA?

Para analizar no solamente el resultado, sino también la relación entre pedido y entrega. Un prompt ambiguo o incompleto puede producir una solución técnicamente plausible pero inadecuada.

### ¿Qué debería hacer un desarrollador antes de aceptar código generado?

Leerlo, ejecutar pruebas, revisar casos límite, validar seguridad, comprobar dependencias, evaluar mantenibilidad y confirmar que cumple el requerimiento real. Si no puede explicarlo, todavía no está en condiciones de entregarlo.

## 11. Resumen para memorizar antes de exponer

1. **Problema:** la IA produce rápido, pero puede equivocarse de forma convincente.
2. **Propuesta:** Changopilot convierte al estudiante en auditor de código.
3. **Dinámica:** host en proyector, alumnos en celulares, seis rondas y una práctica.
4. **Conceptos:** flujo de control, memoria, polimorfismo, SQL, arquitectura y concurrencia.
5. **Tecnología:** HTML, CSS, JavaScript Vanilla, PrismJS, QRCode.js y Supabase Realtime.
6. **Diseño:** estado por fases, Broadcast, modo offline, moderación y resumen final.
7. **Equipo:** Carlos Guariglia es Team Leader y la IA actúa como Junior.
8. **Postura:** la IA propone código; el Team Leader valida, corrige y responde por el resultado.
9. **Cierre:** no hay que aceptar código por confianza, sino por evidencia y comprensión.
8. **Cierre:** no hay que aceptar código por confianza, sino por evidencia y comprensión.
