# Documento de Especificación de Requerimientos - Proyecto: Cuentas

---

## 1. Objetivos del Sistema

* **Centralizar** la gestión de finanzas personales (ingresos y egresos) enfocada en el mercado colombiano.
* **Automatizar** la categorización de transacciones mediante lenguaje natural utilizando Inteligencia Artificial.
* **Facilitar** el registro rápido de movimientos financieros mediante expresiones coloquiales.
* **Proveer** visualización de estado financiero a través de reportes, proyecciones y estimaciones mensuales.

---

## 2. Alcance del Sistema (Funcionalidades Principales)

### 2.1. Gestión de Usuarios y Autenticación

* **Inicio de sesión de terceros:** El acceso al sistema se delegará exclusivamente a Google. El sistema no almacenará contraseñas ni correos electrónicos para autenticación propia; validará la identidad mediante los tokens generados por el proveedor.
* **Aislamiento de datos:** Cada usuario tendrá acceso único y exclusivo a su información financiera, categorías y presupuestos.

### 2.2. Gestión de Categorías y Presupuestos

* **Categorías Precargadas:** El sistema contará con una lista base de categorías estándar para ingresos y egresos.
* **Categorías Personalizadas:** Cada usuario podrá crear, modificar o eliminar sus propias categorías.
* **Presupuesto Mensual:** El usuario podrá asignar un valor esperado (límite de gasto o meta de ingreso) en pesos colombianos ($COP$) a cada categoría para el mes en curso.

### 2.3. Procesamiento de Transacciones con IA (Ingresos y Egresos)

* **Entrada de texto libre:** Registro de movimientos mediante frases rápidas (Ej: *"Me gasté 10 lucas en una salida a comer"* o *"Me entró un palo por el trabajo"*).
* **Interpretación de modismos colombianos:** El sistema debe entender variaciones numéricas y coloquialismos del contexto de Colombia (Ej: "k" = miles, "lucas" = miles, "palos" = millones).
* **Categorización automática:** La IA analizará el texto, extraerá el monto, determinará si es ingreso o egreso, y lo asignará a la categoría más coincidente del usuario.

### 2.4. Reportes y Analítica

* **Totales Mensuales:** Consolidado de dinero ingresado y gastado por mes.
* **Monitoreo de Presupuesto:** Comparativa entre el valor real ejecutado y el valor esperado por categoría.
* **Proyecciones y Estimaciones:** Cálculos basados en el historial para predecir el comportamiento financiero del usuario a fin de mes.

---

## 3. Requerimientos de Interfaz de Programación (Endpoints Requeridos)

El sistema requerirá componentes de software para exponer las siguientes funciones:

* **Módulo de Autenticación:** Validación de tokens de Google e inicio de sesión.
* **Módulo de Categorías:** Crear, listar, actualizar y eliminar categorías (precargadas y personalizadas).
* **Módulo de Presupuestos:** Asignar y modificar los valores esperados por categoría por mes.
* **Módulo de Transacciones:** * Endpoint receptor del texto libre para procesamiento de la IA.
* Confirmación y guardado del registro estructurado (monto, tipo, categoría, fecha).
* Listado e historial de transacciones.


* **Módulo de Reportes:** Obtención de totales, ejecución presupuestal, proyecciones y estimaciones mensuales.