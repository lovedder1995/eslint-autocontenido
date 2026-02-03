const { ESLint } = require('./módulos/lib/api.js');

(async function main() {
  try {
    console.log('Cargando ESLint desde ./módulos/lib/api.js ...');
    
    // Creamos una instancia de ESLint con una configuración básica
    // Usamos overrideConfig para inyectar una configuración plana (Flat Config)
    const eslint = new ESLint({
        overrideConfig: [
            {
                languageOptions: {
                    ecmaVersion: 2022,
                    sourceType: "module"
                },
                rules: {
                    "no-var": "error"
                }
            }
        ]
    });

    console.log('ESLint instanciado correctamente.');

    // Código a analizar: usa 'var', lo cual debería disparar la regla 'no-var'
    const code = 'var foo = "bar";';
    console.log(`Analizando código: '${code}'`);
    
    const results = await eslint.lintText(code);

    // Verificar resultados
    if (results.length > 0) {
        const messages = results[0].messages;
        
        if (messages.length > 0) {
            console.log('Resultados del análisis:');
            messages.forEach(msg => {
                console.log(`  [${msg.ruleId}] ${msg.message}`);
            });

            // Verificamos si encontramos el error esperado
            const hasNoVarError = messages.some(m => m.ruleId === 'no-var');
            if (hasNoVarError) {
                console.log('✅ Prueba EXITOSA: Se detectó el uso prohibido de var.');
            } else {
                console.log('⚠️ Prueba PARCIAL: Se detectaron errores, pero no el esperado.');
            }
        } else {
             console.log('⚠️ No se detectaron errores. Verifica si la regla se aplicó correctamente.');
        }
    } else {
        console.log('⚠️ No se devolvieron resultados de linting.');
    }

  } catch (error) {
    console.error('❌ Error fatal durante la prueba:', error);
    process.exit(1);
  }
})();
