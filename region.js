// Detecta si el visitante está en Argentina y qué moneda usa, por la zona horaria del teléfono.
// Se puede forzar con ?pais=ar o ?pais=int en el link (queda recordado).
(function () {
  var MONEDA_POR_ZONA = [
    [/^America\/(Argentina\/|Buenos_Aires|Cordoba|Mendoza|Catamarca|Jujuy)/, "ARS"],
    [/^America\/(Mexico_City|Monterrey|Merida|Cancun|Chihuahua|Hermosillo|Mazatlan|Tijuana|Matamoros|Bahia_Banderas|Ojinaga|Ciudad_Juarez)/, "MXN"],
    [/^America\/Bogota/, "COP"], [/^America\/(Santiago|Punta_Arenas)|^Pacific\/Easter/, "CLP"],
    [/^America\/Lima/, "PEN"], [/^America\/Montevideo/, "UYU"],
    [/^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)/, "EUR"]
  ];
  var zona = "";
  try { zona = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var moneda = "USD";
  for (var i = 0; i < MONEDA_POR_ZONA.length; i++) if (MONEDA_POR_ZONA[i][0].test(zona)) { moneda = MONEDA_POR_ZONA[i][1]; break; }
  if (moneda === "USD" && /-AR$/i.test(navigator.language || "")) moneda = "ARS";
  var forzado = null;
  try {
    var m = /[?&]pais=(ar|int)\b/.exec(location.search);
    if (m) localStorage.setItem("cc_pais", m[1]);
    forzado = localStorage.getItem("cc_pais");
  } catch (e) {}
  var ar = forzado ? forzado === "ar" : moneda === "ARS";
  if (forzado === "ar") moneda = "ARS"; else if (forzado === "int" && moneda === "ARS") moneda = "USD";
  window.CC_REGION = { ar: ar, moneda: moneda, zona: zona };
})();
