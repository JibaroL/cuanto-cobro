# Cuánto Cobro

Calculadora de costos y precio de venta para reposteras y emprendedores. App web instalable, sin servidor: los datos quedan en el teléfono de cada usuario.

- `index.html`: página de venta.
- `app.html`: la app (versión gratis con 2 recetas propias, PRO con código).
- `config.js`: **el único archivo a tocar** para precios, alias, link de pago y WhatsApp de ventas.
- `codes.js`: huellas de los 1.000 códigos PRO válidos (los códigos no están acá).
- `calc.js`: fórmulas. Pruebas: `node tests/calc.test.js`.
- `sw.js`: funciona sin internet. Subir `VERSION` en cada publicación.

Probar en la compu: `python3 -m http.server 8123` y abrir http://localhost:8123
