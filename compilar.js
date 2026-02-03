const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Función auxiliar para ejecutar comandos en el sistema.
 * Muestra el comando en consola y detiene el proceso si hay errores.
 */
function run(command) {
    console.log(`\n[Ejecutando]: ${command}`);
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`[Error]: Falló la ejecución del comando: ${command}`);
        process.exit(1);
    }
}

console.log('=== Iniciando Compilación de ESLint Autocontenido ===');

// ==========================================
// PASO 1: Preparar Entorno de Salida
// ==========================================
// Creamos la estructura de directorios necesaria dentro de "módulos/".
// Esto es crucial porque esbuild no crea directorios padre automáticamente.
// - módulos/lib: Para la API de ESLint
// - módulos/bin: Para el ejecutable CLI
// - módulos/cli-engine/formatters: Para los formateadores de salida (json, stylish, etc.)
console.log('\n--> Paso 1: Creando directorios...');
const dirs = [
    'módulos/lib',
    'módulos/bin',
    'módulos/cli-engine/formatters'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`    + Creado: ${dir}`);
    } else {
        console.log(`    . Existe: ${dir}`);
    }
});

// ==========================================
// PASO 2: Compilar Dependencias Internas (Jiti)
// ==========================================
// ESLint usa 'jiti' para cargar configuraciones dinámicamente (soporte TS/ESM).
// Necesitamos una versión compilada de jiti que pueda ser requerida por nuestro bundle principal.
//
// ¿Por qué?
// 1. Evitamos node_modules en runtime.
// 2. ESLint verifica internamente la versión de jiti, por eso inyectamos el footer con la versión.
console.log('\n--> Paso 2: Compilando Jiti...');
const jitiVersion = '2.6.1';

// Compilamos jiti.cjs a un archivo autocontenido (sin dependencias externas)
run(`npx esbuild node_modules/jiti/lib/jiti.cjs --bundle --platform=node --outfile=módulos/jiti.js "--footer:js=module.exports.version = '${jitiVersion}';"`);

// Creamos un archivo de metadatos falso para jiti.
// ESLint a veces intenta leer 'jiti/package.json' para verificar versiones.
// Redirigiremos esas lecturas a este archivo.
fs.writeFileSync('módulos/jiti-meta.json', JSON.stringify({ version: jitiVersion }, null, 2));
console.log('    + Creado: módulos/jiti-meta.json (Metadatos simulados)');

// ==========================================
// PASO 3: Compilar Formatters Esenciales
// ==========================================
// Los formatters (como la salida 'stylish' por defecto) son cargados dinámicamente por ESLint
// basándose en rutas de archivo. No se incluyen automáticamente en el bundle principal
// porque son "lazy loaded". Debemos compilarlos individualmente en su ubicación esperada.
console.log('\n--> Paso 3: Compilando Formatters...');
const formatters = [
    'stylish.js',
    'html.js',
    'json.js',
    'json-with-metadata.js'
];

formatters.forEach(formatter => {
    // Compilamos cada formatter individualmente
    run(`npx esbuild node_modules/eslint/lib/cli-engine/formatters/${formatter} --bundle --platform=node --outfile=módulos/cli-engine/formatters/${formatter}`);
});

// Copiamos los metadatos de los formatters si existen.
// Esto es necesario para que ESLint sepa qué formatters están disponibles.
const metaSrc = path.join('node_modules', 'eslint', 'lib', 'cli-engine', 'formatters', 'formatters-meta.json');
const metaDest = path.join('módulos', 'cli-engine', 'formatters', 'formatters-meta.json');
if (fs.existsSync(metaSrc)) {
    fs.copyFileSync(metaSrc, metaDest);
    console.log(`    + Copiado: formatters-meta.json`);
} else {
    console.warn(`    ! Advertencia: No se encontró ${metaSrc}`);
}

// ==========================================
// PASO 4: Compilar ESLint (CLI y API)
// ==========================================
// Aquí ocurre la magia principal. Compilamos el punto de entrada de la CLI y de la API.
//
// Configuraciones clave de esbuild:
// --bundle: Empaqueta todo el código y dependencias en un solo archivo.
// --platform=node: Optimiza para Node.js (usa require/module.exports).
// --external:fsevents: Excluye dependencias nativas opcionales que suelen dar problemas.
//
// Alias (--alias):
// Redirigimos las importaciones de 'jiti' dentro de ESLint para que usen nuestra
// versión compilada en el Paso 2, en lugar de buscar en node_modules.
// - alias:jiti=../jiti.js -> Redirige require('jiti') al archivo compilado.
// - alias:jiti/package.json -> Redirige la lectura del package.json de jiti a nuestros metadatos.

console.log('\n--> Paso 4: Compilando Core de ESLint...');

// 4.1 CLI (bin/eslint-autocontenido.js)
// Este es el ejecutable que se corre desde la terminal.
// Se usa '../jiti.js' porque el output está en 'módulos/bin/', así que subimos un nivel.
console.log('    [CLI] Generando binario...');
run(`npx esbuild node_modules/eslint/bin/eslint.js --bundle --platform=node --format=cjs --outfile=módulos/bin/eslint-autocontenido.js --alias:jiti=../jiti.js --alias:jiti/package.json=./módulos/jiti-meta.json --external:../jiti.js --external:fsevents`);

// 4.2 API (lib/api.js)
// Esta es la librería que se usa cuando haces require('eslint') en otro script.
console.log('    [API] Generando librería...');
run(`npx esbuild node_modules/eslint/lib/api.js --bundle --platform=node --outfile=módulos/lib/api.js --alias:jiti=../jiti.js --alias:jiti/package.json=./módulos/jiti-meta.json --external:../jiti.js`);

console.log('\n=== Compilación Completada Exitosamente ===');
console.log('Los archivos generados se encuentran en el directorio "módulos/".');
