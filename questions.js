const QUESTIONS = [
  {
    id: 1,
    category: "Algoritmos 1 • C++",
    language: "cpp",
    prompt: "Escribí un bucle en C++ que procese los primeros 10 pedidos.",
    code: `int pedido = 1;
while (pedido <= 10); {
    procesar(pedido);
    pedido++;
}`,
    question: "Ejecutás el programa. ¿Qué ocurre?",
    options: [
      "Procesa del pedido 1 al 10 normalmente.",
      "Se queda colgado en un bucle infinito sin procesar ni un pedido (por el ';' tras el while).",
      "Procesa solo el pedido 1 y sale del bucle.",
      "No compila bajo ningún estándar de C++."
    ],
    correctIndex: 1,
    moraleja: "Un simple punto y coma convierte al while en un bucle vacío eterno; si mirás el código por arriba como pasamanos, tu cerebro lo ignora."
  },
  {
    id: 2,
    category: "Memoria Dinámica • C++",
    language: "cpp",
    prompt: "Creá una función en C++ que procese un reporte temporal usando memoria dinámica.",
    code: `void generarReporte() {
    int* buffer = new int[10000];
    cargarDatos(buffer);
    if (huboError()) return;
    delete[] buffer;
}`,
    question: "El sistema corre 24/7 y cada tanto huboError() da verdadero. ¿Qué ocurre?",
    options: [
      "Nada, C++ libera 'buffer' automáticamente al hacer return.",
      "Fuga de memoria (Memory Leak): cada error deja 10.000 enteros ocupados en RAM.",
      "El programa se reinicia solo al detectar el return temprano.",
      "Se sobreescribe el mismo buffer en la siguiente llamada."
    ],
    correctIndex: 1,
    moraleja: "Un return temprano antes del delete deja memoria huérfana; sin entender el ciclo de vida de recursos (o usar RAII), la app se queda sin RAM en producción."
  },
  {
    id: 3,
    category: "POO y Polimorfismo • C++",
    language: "cpp",
    prompt: "Modelame un sistema de notificaciones polimórfico en C++ con clase base y derivada.",
    code: `class Notificacion {
public:
    void enviar() { cout << "Generica\\n"; }
};
class Email : public Notificacion {
public:
    void enviar() { cout << "Enviando Email\\n"; }
};
// En el main:
Notificacion* n = new Email();
n->enviar();`,
    question: "¿Qué imprime ese código y por qué?",
    options: [
      "Imprime 'Enviando Email' gracias a la herencia.",
      "Imprime 'Generica' porque falta 'virtual' en la clase base.",
      "Da error de compilación por sobrescribir un método.",
      "Imprime ambos mensajes uno atrás del otro."
    ],
    correctIndex: 1,
    moraleja: "Heredar no alcanza para tener polimorfismo en C++; sin 'virtual', el compilador mira el tipo del puntero y no el del objeto real."
  },
  {
    id: 4,
    category: "Bases de Datos • SQL",
    language: "sql",
    prompt: "Dame la consulta SQL para borrar los pedidos cancelados de la tabla pedidos.",
    code: `DELETE FROM pedidos
WHERE estado = 'CANCELADO' OR 1 = 1;`,
    question: "Un junior copia, pega y ejecuta esto en producción. ¿Qué ocurre?",
    options: [
      "Borra solo los pedidos con estado 'CANCELADO'.",
      "Da error de sintaxis porque 1 = 1 no es válido en DELETE.",
      "Borra TODOS los registros de la tabla pedidos.",
      "Borra únicamente el primer registro que encuentra."
    ],
    correctIndex: 2,
    moraleja: "'OR 1 = 1' hace que toda la condición sea siempre verdadera; ejecutar un script SQL sin auditarlo te vacía una base entera."
  },
  {
    id: 5,
    category: "Arquitectura de Software • JS",
    language: "javascript",
    prompt: "Agregá soporte para pagar con MercadoPago en nuestro módulo CarritoDeCompras.",
    code: `class CarritoDeCompras {
    pagar(metodo, monto) {
        if (metodo === "EFECTIVO") {
            console.log("Cobrando en caja: " + monto);
        } else if (metodo === "TARJETA") {
            procesarPosnet(monto);
        } else if (metodo === "MERCADOPAGO") {
            sdkMercadoPago.crearPreferencia(monto);
        }
    }
}`,
    question: "El código funciona hoy. ¿Por qué un Analista lo frena en una revisión?",
    options: [
      "Porque '===' en JavaScript no sirve para comparar strings.",
      "Viola Abierto/Cerrado y acopla el carrito a SDKs externos: cada pago nuevo obliga a tocar el núcleo.",
      "Porque una clase en JavaScript no puede llamar funciones externas.",
      "Porque 'else if' bloquea el Event Loop de Node.js."
    ],
    correctIndex: 1,
    moraleja: "La IA siempre mete un 'else if' más para salir del paso; sin desacoplar con estrategias o interfaces, terminás con un monolito rígido."
  },
  {
    id: 6,
    category: "Análisis y Concurrencia • JS",
    language: "javascript",
    prompt: "Escribí la lógica en JS para reservar un asiento cuando queda 1 disponible.",
    code: `async function reservarAsiento(salaId) {
    const libres = await db.contarLibres(salaId);
    if (libres > 0) {
        await db.ocuparAsiento(salaId);
        return "Reservado";
    }
}`,
    question: "Dos usuarios hacen clic en 'Reservar' al mismo milisegundo cuando queda 1 lugar. ¿Qué pasa?",
    options: [
      "Uno reserva y el otro recibe error automáticamente.",
      "Sobreventa (Race Condition): ambos leen libres === 1 y reservan el mismo asiento.",
      "La base de datos bloquea el servidor por 10 minutos.",
      "Ninguno de los dos logra reservar."
    ],
    correctIndex: 1,
    moraleja: "La IA escribe código para un usuario ideal en laboratorio; prever concurrencia y reglas críticas de negocio es responsabilidad del Analista."
  }
];
