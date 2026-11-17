const PRACTICE_QUESTION = {
  id: "practice",
  category: "Práctica • C++",
  language: "cpp",
  prompt: "Leé el código y seguí el valor de la variable paso a paso.",
  code: `int puntos = 0;
for (int i = 1; i <= 3; i++) {
    puntos += i;
}`,
  question: "¿Qué valor tiene 'puntos' al finalizar el for?",
  options: [
    "Tiene el valor 3, porque el ciclo se ejecuta tres veces.",
    "Tiene el valor 6, porque suma 1 + 2 + 3.",
    "Tiene el valor 4, porque empieza en 0 y termina en 3.",
    "Tiene el valor 0, porque la variable no cambia dentro del ciclo."
  ],
  correctIndex: 1,
  moraleja: "Para analizar código, seguí el estado de las variables después de cada iteración, no solo la cantidad de veces que se repite el ciclo.",
  explanation: "La variable puntos empieza en 0. El ciclo pasa tres veces: en la primera suma 1 y queda en 1, en la segunda suma 2 y queda en 3, y en la tercera suma 3 y queda en 6. La cantidad de vueltas no es el resultado: hay que seguir qué cambia dentro de cada vuelta."
};

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
    moraleja: "Un simple punto y coma convierte al while en un bucle vacío eterno; si mirás el código por arriba como pasamanos, tu cerebro lo ignora.",
    explanation: "En C++, el punto y coma también puede representar una instrucción vacía. Por eso ese while termina allí y repite una tarea que no hace nada mientras pedido siga valiendo 1. El bloque entre llaves queda separado del ciclo y nunca llega a ejecutarse. Es como poner un cartel que dice 'repetir' pero dejar la tarea real fuera del cartel."
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
    moraleja: "Un return temprano antes del delete deja memoria huérfana; sin entender el ciclo de vida de recursos (o usar RAII), la app se queda sin RAM en producción.",
    explanation: "new reserva un espacio para 10.000 enteros y devuelve la dirección de ese espacio. Cuando ocurre un error, return sale inmediatamente de la función y salta el delete[], que era el encargado de liberar esa memoria. La información deja de ser útil, pero el espacio sigue ocupado; cada error agrega otra porción que no se puede reutilizar. Es parecido a guardar cajas en un depósito y perder la dirección de cada una: siguen ocupando lugar aunque ya no podamos usarlas."
  },
  {
    id: 3,
    category: "POO y Polimorfismo • C++",
    language: "cpp",
    prompt: "Modelame un sistema de notificaciones polimórfico en C++ con clase base y derivada.",
    code: `#include <iostream>
using namespace std;

class Notificacion {
public:
    void enviar() { cout << "Generica\\n"; }
};
class Email : public Notificacion {
public:
    void enviar() { cout << "Enviando Email\\n"; }
};
int main() {
    Notificacion* n = new Email();
    n->enviar();
    delete n;
}`,
    question: "¿Qué imprime ese código y por qué?",
    options: [
      "Imprime 'Enviando Email' gracias a la herencia.",
      "Imprime 'Generica' porque falta 'virtual' en la clase base.",
      "Da error de compilación por sobrescribir un método.",
      "Imprime ambos mensajes uno atrás del otro."
    ],
    correctIndex: 1,
    moraleja: "Heredar no alcanza para tener polimorfismo en C++; sin 'virtual', el compilador mira el tipo del puntero y no el del objeto real.",
    explanation: "n apunta a un objeto Email, pero está declarado como un puntero a Notificacion. Sin virtual, C++ decide qué enviar() usar mirando el tipo de la referencia (Notificacion*) y por eso imprime 'Generica'. La herencia permite que Email sea tratado como una Notificacion, pero para que cada objeto responda con su propia versión hay que indicar que el método puede comportarse de forma polimórfica. La idea es similar a llamar a 'enviar' sin importar si el mensaje sale por email o por otro medio: la acción es la misma, pero cada tipo la realiza de manera diferente."
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
    moraleja: "'OR 1 = 1' hace que toda la condición sea siempre verdadera; ejecutar un script SQL sin auditarlo te vacía una base entera.",
    explanation: "La condición pide que el estado sea CANCELADO o que 1 sea igual a 1. Como 1 siempre es igual a 1, la segunda parte siempre resulta verdadera. Con OR alcanza con que una parte sea verdadera, así que todas las filas cumplen la condición y el DELETE borra todos los pedidos. Es como permitir el ingreso si alguien tiene autorización o si el sol siempre sale: la segunda condición hace que cualquiera pueda pasar."
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
    moraleja: "La IA siempre mete un 'else if' más para salir del paso; sin desacoplar con estrategias o interfaces, terminás con un monolito rígido.",
    explanation: "El código actual funciona, pero CarritoDeCompras conoce los detalles de cada medio de pago y debe modificarse cada vez que aparece uno nuevo. Eso es riesgoso: al agregar MercadoPago, podríamos romper el pago con tarjeta. En una organización más flexible, el carrito no sabe cómo funciona cada medio: recibe un objeto que sabe realizar un pago y le delega esa tarea. Sí, una función termina llamando a otra, pero eso es justamente delegar: cada parte se ocupa de una responsabilidad concreta. Si mañana agregamos PagoConTransferencia, creamos una clase nueva y el carrito queda igual. Esa es la idea de Abierto/Cerrado: abierto para agregar comportamientos, pero cerrado a modificaciones innecesarias.",
    improvedCode: `class PagoConTarjeta {
    pagar(monto) {
        procesarPosnet(monto);
    }
}

class PagoConMercadoPago {
    pagar(monto) {
        sdkMercadoPago.crearPreferencia(monto);
    }
}

class CarritoDeCompras {
    constructor(medioDePago) {
        this.medioDePago = medioDePago;
    }

    pagar(monto) {
        this.medioDePago.pagar(monto);
    }
}`
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
    moraleja: "La IA escribe código para un usuario ideal en laboratorio; prever concurrencia y reglas críticas de negocio es responsabilidad del Analista.",
    explanation: "Las dos solicitudes pueden leer libres = 1 casi al mismo tiempo. Como ninguna alcanzó a actualizar la base todavía, las dos creen que queda un lugar y ambas intentan reservarlo. El problema no está en que una función esté mal escrita, sino en que dos acciones se intercalan sin proteger la regla 'solo puede quedar una reserva'. La solución debe hacer la verificación y la reserva como una sola operación protegida, para que cuando una persona tome el último lugar la otra reciba un resultado correcto."
  }
];
