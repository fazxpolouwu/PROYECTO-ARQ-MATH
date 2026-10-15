# ARQ-MATH 3D

Juego educativo de matemáticas aplicadas a arquitectura con HTML, CSS, JavaScript y Three.js.

## Archivos
- `index.html`: estructura y paneles de la aplicación.
- `styles.css`: estilos y diseño adaptable a móvil.
- `game.js`: escena 3D, preguntas, temporizador, puntuación y ranking local.

## Cómo ejecutarlo
1. Descarga y descomprime `ARQ-MATH-3D.zip`.
2. Abre la carpeta en Visual Studio Code.
3. Instala la extensión **Live Server** si no la tienes.
4. Haz clic derecho sobre `index.html` y elige **Open with Live Server**.
5. Debes tener conexión a internet para cargar Three.js desde jsDelivr y la fuente desde Google Fonts.

También puedes usar cualquier servidor local estático que sirva módulos JavaScript ES.

## Controles
- Arrastra con el ratón sobre la maqueta para girar la cámara.
- Usa la rueda del ratón para acercar o alejar.
- Escribe tu nombre, inicia la partida y responde los 10 problemas.
- Cada respuesta correcta añade una planta a la torre.
- La clasificación se guarda en `localStorage` de ese navegador.

## Notas
- El ranking es local y no se comparte entre dispositivos ni jugadores.
- Las preguntas son ejemplos educativos. Las respuestas de trigonometría y cálculo usan tolerancias para admitir redondeos.
- Para una clasificación global, autenticación y resultados compartidos se necesita un backend y validación en servidor.
