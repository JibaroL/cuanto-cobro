// Datos de venta. Es el único archivo que hay que tocar para cambiar precios o medios de cobro.
// Si un campo queda vacío, su botón no aparece.
window.CC_CONFIG = {
  marca: "Cuánto Cobro",
  whatsappVentas: "5493517021924", // solo números con código de país, ej: "5493511234567"
  aliasMP: "jibaro.code",      // alias de Mercado Pago para transferencias
  aliasNX: "jibaro.code.nx",   // alias de Naranja X
  titularAlias: "",            // nombre que ve el cliente al transferir
  linkPagoAR: "https://mpago.la/1vfzfRj", // link de pago de Mercado Pago (Argentina)
  linkPagoInternacional: "",   // Hotmart o Lemon Squeezy (resto del mundo)
  precioAR: "$ 9.900",         // precio que se muestra en Argentina
  precioLanzamientoAR: "$ 5.900",
  precioUSD: "USD 9",
  precioLanzamientoUSD: "USD 5",
  lanzamientoActivo: true,
  recetasGratis: 2
};
