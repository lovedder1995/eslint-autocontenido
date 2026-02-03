# ESLint Autocontenido

Este proyecto compila una versión autocontenida de **ESLint** utilizando **exclusivamente dependencias de desarrollo**.

## Filosofía del Proyecto

*   **Solo dependencias de desarrollo**: ESLint y todas sus dependencias necesarias se instalan con `--save-dev`.
*   **Compilación Autocontenida**: Usamos `esbuild` para empaquetar el código, eliminando la necesidad de `node_modules` en tiempo de ejecución.
*   **Integración Transparente**: Las dependencias críticas (como `jiti`) se integran directamente en el bundle.
*   **Reemplazo Directo**: Configurado para funcionar como un reemplazo directo del paquete `eslint` estándar.

## Requisitos Previos

1.  Node.js instalado.
2.  Estar en la raíz del proyecto.
3.  Instalar dependencias (en modo desarrollo):
    ```bash
    npm install
    # O si estás iniciando:
    # npm install eslint jiti esbuild --save-dev
    ```

## Pasos de Compilación

Para compilar el proyecto, utiliza el script automatizado que hemos preparado. Este script se encarga de empaquetar todas las dependencias y generar una versión autocontenida lista para producción.

```bash
node compilar.js
```

El script `compilar.js` contiene explicaciones detalladas sobre cada paso del proceso.

### 5. Configuración del Paquete (package.json)

Para que este paquete funcione como un reemplazo directo, actualiza tu `package.json` con los siguientes campos:

```json
{
  "main": "./módulos/lib/api.js",
  "bin": {
    "eslint-autocontenido": "./módulos/bin/eslint-autocontenido.js"
  },
  "exports": {
    ".": "./módulos/lib/api.js",
    "./package.json": "./package.json"
  },
  "files": [
    "módulos",
    "README.md",
    "LICENSE"
  ]
}
```

## Verificación

1.  **Verificar CLI:**
    ```bash
    node módulos/bin/eslint-autocontenido.js --version
    # Debería mostrar la versión de ESLint (ej. v9.39.2)
    ```

2.  **Verificar Uso Programático:**
    Ejecuta el script de prueba incluido:
    ```bash
    node prueba.js
    ```

## Instalación

```bash
npm install --save-dev github:lovedder1995/eslint-autocontenido#{última.fecha.de.publicación}
```
