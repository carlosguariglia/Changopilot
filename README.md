# 🤖 Changopilot — IA: ¿Copiloto o Chango Automático?

Dinámica interactiva en tiempo real (*Live Code Review*) diseñada para estudiantes de la Tecnicatura Superior en Análisis de Sistemas (**ISFT 151**).

> *"Tengo la idea de que la IA debe ser como si fuera un empleado mío y yo fuera su jefe/encargado: yo le asigno una tarea, pero esa tarea no se la puedo ofrecer al cliente como me la entrega la IA; debe pasar por mí, siendo yo una especie de filtro y tomando la responsabilidad de la tarea producida, y no ser un simple pasamanos."*
> — **Carlos Guariglia**

---

## 🎯 Propósito Pedagógico

En el desarrollo de software moderno, la Inteligencia Artificial escribe sintaxis a gran velocidad, pero carece de contexto de negocio, sentido común y responsabilidad profesional. El objetivo de **Changopilot** es entrenar el criterio técnico de los futuros analistas: **nadie puede auditar ni filtrar lo que no entiende**.

Durante la actividad, los participantes asumen el rol de **Tech Leads** y auditan 6 entregables generados por un "Junior IA" que compilan y parecen correctos a simple vista, pero esconden errores críticos antes de salir a producción.

---

## 🧩 Las 6 Rondas de Code Review

| Ronda | Área / Lenguaje | Trampa oculta en el entregable de la IA |
| :--- | :--- | :--- |
| **1** | **Algoritmos 1 (C++)** | Punto y coma (`;`) tras un `while` que genera un bucle infinito silencioso. |
| **2** | **Memoria Dinámica (C++)** | `return` temprano antes de `delete[]` provocando *Memory Leaks* en producción. |
| **3** | **POO y Polimorfismo (C++)** | Omisión de `virtual` en la clase base rompiendo el despacho dinámico. |
| **4** | **Bases de Datos (SQL)** | Cláusula `OR 1 = 1` en un `DELETE` que vacía la tabla completa. |
| **5** | **Arquitectura (JavaScript)** | Cadena de `else if` acoplando el carrito a SDKs externos (violación de Abierto/Cerrado). |
| **6** | **Análisis y Concurrencia (JS)** | *Race Condition* en reserva concurrente de asientos sin control transaccional. |

---

## 🛠️ Stack Técnico y Arquitectura

* **Frontend:** HTML5, CSS3 (tema **Light** predeterminado con switch a **Dark**) y Vanilla JavaScript puro, sin dependencias de build.
* **Resaltado de Sintaxis y QR:** PrismJS y QRCode.js vía CDN.
* **Sincronización en Tiempo Real:** Supabase Realtime (modo *Broadcast*, sin necesidad de base de datos ni tablas).
* **Resiliencia en el Aula:** Incluye un **Modo Offline** manual en la vista del presentador para continuar la dinámica si falla la conectividad en el instituto.
* **Moderación de Lobby:** Filtro normalizado de alias ofensivos (incluyendo detección de *leetspeak*) y expulsión en un clic desde la vista del proyector.
* **Ronda de Práctica:** Antes de las seis rondas puntuables se incluye un ejercicio guiado, con tiempo, que no afecta el ranking.
* **Resumen de Aprendizaje:** Al finalizar, cada participante puede imprimir o guardar como PDF las preguntas, respuestas, explicaciones y su puntaje.
* **Experiencia Mobile:** El código de cada pregunta se muestra abierto y se adapta a pantallas pequeñas.

---

## 🚀 Cómo Ejecutar y Desplegar

### 1. Vista de Presentador (Proyector) vs. Alumnos (Celulares)
* **Alumnos:** Acceden a la URL raíz (`https://<tu-usuario>.github.io/changopilot/`).
* **Proyector (Host):** Accede agregando el parámetro `?host=true` (`https://<tu-usuario>.github.io/changopilot/?host=true`), donde se genera automáticamente el código QR para que el aula se conecte.

### 2. Prueba Local
Desde la carpeta del proyecto, levantá un servidor estático vinculado a la red local:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
