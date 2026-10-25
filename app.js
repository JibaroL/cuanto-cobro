(function () {
  "use strict";
  var CFG = window.CC_CONFIG || {};
  var C = window.CCCalc;
  var CLAVE = "cuantocobro_v1";
  var $vista = document.getElementById("vista");
  var $hoja = document.getElementById("hoja");

  var MONEDAS = [
    ["ARS", "Peso argentino"], ["MXN", "Peso mexicano"], ["COP", "Peso colombiano"], ["CLP", "Peso chileno"],
    ["PEN", "Sol peruano"], ["UYU", "Peso uruguayo"], ["EUR", "Euro"], ["USD", "Dólar"]
  ];
  var UNID_COMPRA = [["kg", "kg"], ["g", "gramos"], ["l", "litro"], ["ml", "ml"], ["u", "unidad"], ["doc", "docena"]];

  // ---------- Datos ----------
  function id() { return Math.random().toString(36).slice(2, 10); }
  // Precios de ejemplo pensados en pesos argentinos; se llevan a la moneda del visitante de forma aproximada.
  var REG = window.CC_REGION || { ar: true, moneda: "ARS" };
  var FACTOR = { ARS: 1, USD: 1 / 1400, EUR: 1 / 1550, MXN: 1 / 75, COP: 3, CLP: 0.7, PEN: 1 / 380, UYU: 1 / 35 };
  var REDONDEO = { ARS: 100, USD: 1, EUR: 1, MXN: 10, COP: 1000, CLP: 100, PEN: 1, UYU: 10 };
  function local(n) {
    var x = n * (FACTOR[REG.moneda] || 1);
    if (x >= 10) { var p = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / p) * p; }
    return Math.round(x * 100) / 100;
  }
  function ejemplo() {
    var i = {
      harina: { id: id(), nombre: "Harina 0000", precio: 1200, cant: 1, unidad: "kg" },
      azucar: { id: id(), nombre: "Azúcar", precio: 1400, cant: 1, unidad: "kg" },
      manteca: { id: id(), nombre: "Manteca", precio: 2600, cant: 200, unidad: "g" },
      huevos: { id: id(), nombre: "Huevos", precio: 3600, cant: 1, unidad: "doc" },
      cacao: { id: id(), nombre: "Cacao amargo", precio: 3500, cant: 250, unidad: "g" },
      leche: { id: id(), nombre: "Leche", precio: 1500, cant: 1, unidad: "l" },
      caja: { id: id(), nombre: "Caja para torta", precio: 9000, cant: 10, unidad: "u" }
    };
    var insumos = Object.keys(i).map(function (k) { i[k].precio = local(i[k].precio); i[k].actualizado = Date.now(); return i[k]; });
    var torta = {
      id: id(), nombre: "Torta de chocolate (ejemplo)", ejemplo: true, rinde: 12, unidadVenta: "porción",
      horas: 2, valorHora: "", margen: 50,
      items: [
        { insumoId: i.harina.id, cant: 400, unidad: "g" }, { insumoId: i.azucar.id, cant: 300, unidad: "g" },
        { insumoId: i.manteca.id, cant: 200, unidad: "g" }, { insumoId: i.huevos.id, cant: 4, unidad: "u" },
        { insumoId: i.cacao.id, cant: 80, unidad: "g" }, { insumoId: i.leche.id, cant: 250, unidad: "ml" },
        { insumoId: i.caja.id, cant: 1, unidad: "u" }
      ],
      extras: [{ nombre: "Gas y luz", monto: local(600) }]
    };
    return {
      insumos: insumos, recetas: [torta],
      ajustes: { negocio: "", moneda: REG.moneda, valorHora: local(3000), margen: 50, redondeo: REDONDEO[REG.moneda] || 0 },
      pro: { ok: false, codigo: "" }
    };
  }

  var S;
  function cargar() {
    try {
      var raw = localStorage.getItem(CLAVE);
      if (raw) { S = JSON.parse(raw); }
    } catch (e) { S = null; }
    if (!S || !S.insumos) { S = ejemplo(); fijarPublicados(); guardar(); }
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) { toast("No se pudo guardar en este teléfono"); }
  }
  function porId() { var m = {}; S.insumos.forEach(function (x) { m[x.id] = x; }); return m; }
  function calc(r) { return C.calcularReceta(r, porId(), S.ajustes); }
  function fijarPublicados() { S.recetas.forEach(function (r) { r.precioPublicado = calc(r).precio; }); }
  function recetasPropias() { return S.recetas.filter(function (r) { return !r.ejemplo; }).length; }
  function esPro() { return !!(S.pro && S.pro.ok); }

  // ---------- Utilidades ----------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function plata(n) {
    var m = S.ajustes.moneda || "ARS";
    var dec = ["EUR", "USD", "PEN"].indexOf(m) >= 0 ? 2 : 0;
    var o = { style: "currency", currency: m, currencyDisplay: "narrowSymbol", minimumFractionDigits: dec, maximumFractionDigits: dec };
    try { return new Intl.NumberFormat("es-AR", o).format(n || 0); } catch (e1) { delete o.currencyDisplay; }
    try { return new Intl.NumberFormat("es-AR", o).format(n || 0); }
    catch (e) { return "$ " + Math.round(n || 0); }
  }
  function pct(n) { return (n > 0 ? "+" : "") + n.toFixed(0) + "%"; }
  var tt;
  function toast(msg) {
    var t = document.getElementById("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function opciones(lista, actual) {
    return lista.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(actual) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("");
  }
  function copiar(texto, ok) {
    try {
      navigator.clipboard.writeText(texto).then(function () { toast(ok || "Copiado"); }, function () { toast("Mantené apretado el texto para copiarlo"); });
    } catch (e) { toast("Mantené apretado el texto para copiarlo"); }
  }

  // ---------- Navegación ----------
  var ruta = { vista: "recetas", recetaId: null };
  function ir(v, extra) {
    ruta = Object.assign({ vista: v }, extra || {});
    cerrarHoja();
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    document.querySelectorAll(".tab").forEach(function (b) {
      var activa = b.getAttribute("data-ir") === ruta.vista || (ruta.vista === "receta" && b.getAttribute("data-ir") === "recetas");
      if (activa) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    document.getElementById("plan").textContent = esPro() ? "PRO" : "Gratis";
    document.getElementById("titulo").textContent = S.ajustes.negocio || CFG.marca || "Cuánto Cobro";
    ({ recetas: vRecetas, receta: vReceta, insumos: vInsumos, lista: vLista, ajustes: vAjustes }[ruta.vista] || vRecetas)();
  }

  // ---------- Recetas ----------
  function vRecetas() {
    var cambiadas = S.recetas.map(function (r) { var c = calc(r); return { r: r, c: c, dif: r.precioPublicado ? (c.precio - r.precioPublicado) / r.precioPublicado * 100 : 0 }; });
    var subas = cambiadas.filter(function (x) { return Math.abs(x.dif) >= 1; });
    var h = '<div class="fila"><h2 class="crece">Tus recetas</h2><button class="btn" data-a="nueva-receta">+ Nueva</button></div>';
    if (subas.length) {
      h += '<div class="aviso"><strong>Cambiaron tus costos: ' + subas.length + (subas.length === 1 ? " receta tiene" : " recetas tienen") + ' otro precio sugerido</strong>';
      subas.forEach(function (x) {
        h += '<div class="fila"><span class="crece">' + esc(x.r.nombre) + '</span><span class="precio">' + plata(x.r.precioPublicado) + " → " + plata(x.c.precio) + "</span></div>";
      });
      h += '<button class="btn" data-a="ya-actualice">Ya actualicé mis precios</button></div>';
    }
    if (!S.recetas.length) {
      h += '<div class="card vacio"><h3>Todavía no cargaste recetas</h3><p class="muted">Cargá una receta con sus ingredientes y te decimos cuánto te cuesta y a cuánto venderla.</p><button class="btn" data-a="nueva-receta">Cargar mi primera receta</button></div>';
    }
    h += '<div class="lista">';
    cambiadas.forEach(function (x) {
      var b = x.r.ejemplo ? '<span class="badge b-ej">Ejemplo</span>' : "";
      if (Math.abs(x.dif) >= 1) b += ' <span class="badge b-up">' + pct(x.dif) + "</span>";
      h += '<button class="item" data-a="abrir-receta" data-id="' + x.r.id + '"><span class="crece"><span class="nombre">' + esc(x.r.nombre || "Receta sin nombre") + "</span><br>" +
        '<span class="small muted">Costo ' + plata(x.c.total) + (x.c.rinde > 1 ? " · " + x.c.rinde + " " + esc(x.r.unidadVenta || "porciones") : "") + "</span> " + b + "</span>" +
        '<span class="precio">' + plata(x.c.precio) + "</span></button>";
    });
    h += "</div>";
    if (!esPro()) {
      var libres = Math.max(0, (CFG.recetasGratis || 2) - recetasPropias());
      h += '<p class="small muted">Versión gratis: te ' + (libres === 1 ? "queda 1 receta" : "quedan " + libres + " recetas") + '. <a href="#" data-a="comprar">Pasá a PRO</a> para cargar todas las que quieras.</p>';
    }
    $vista.innerHTML = h;
  }

  function nuevaReceta() {
    if (!esPro() && recetasPropias() >= (CFG.recetasGratis || 2)) { hojaComprar("Llegaste al límite de la versión gratis"); return; }
    var r = { id: id(), nombre: "", rinde: 1, unidadVenta: "unidad", horas: 1, valorHora: "", margen: S.ajustes.margen, items: [], extras: [] };
    S.recetas.unshift(r); r.precioPublicado = calc(r).precio; guardar();
    ir("receta", { recetaId: r.id });
  }
  function recetaActual() { return S.recetas.find(function (r) { return r.id === ruta.recetaId; }); }

  function vReceta() {
    var r = recetaActual(); if (!r) { ir("recetas"); return; }
    var opIns = S.insumos.map(function (x) { return [x.id, x.nombre]; }).sort(function (a, b) { return a[1].localeCompare(b[1]); });
    var h = '<div class="fila"><button class="btn borde" data-a="volver">← Recetas</button><span class="crece"></span>' +
      (r.ejemplo ? '<span class="badge b-ej">Ejemplo</span>' : "") + "</div>";
    h += '<div class="card"><label>Nombre<input id="r-nombre" data-r="nombre" value="' + esc(r.nombre) + '" placeholder="Ej: Budín de limón"></label>' +
      '<div class="grid2"><label>Rinde<input id="r-rinde" data-r="rinde" type="number" inputmode="decimal" min="1" value="' + esc(r.rinde) + '"></label>' +
      '<label>Se vende por<input id="r-uv" data-r="unidadVenta" value="' + esc(r.unidadVenta) + '" placeholder="porción, unidad, docena"></label></div></div>';

    h += '<div class="card"><h3>Ingredientes y materiales</h3>';
    if (!S.insumos.length) h += '<p class="muted small">Primero cargá tus insumos con lo que pagaste.</p>';
    r.items.forEach(function (it, n) {
      var ins = porId()[it.insumoId];
      var CORTO = { g: "g", kg: "kg", ml: "ml", l: "l", cc: "cc", u: "u.", doc: "doc." };
      var uds = ins ? C.compatibles(ins.unidad).map(function (u) { return [u, CORTO[u]]; }) : [["u", "u."]];
      h += '<div class="ing"><select id="i-ins-' + n + '" data-it="' + n + '" data-k="insumoId" aria-label="Insumo">' + opciones(opIns, it.insumoId) + "</select>" +
        '<input id="i-cant-' + n + '" data-it="' + n + '" data-k="cant" type="number" inputmode="decimal" value="' + esc(it.cant) + '" aria-label="Cantidad">' +
        '<select id="i-u-' + n + '" data-it="' + n + '" data-k="unidad" aria-label="Unidad">' + opciones(uds, it.unidad) + "</select>" +
        '<button class="x" data-a="quitar-item" data-n="' + n + '" aria-label="Quitar">✕</button></div>';
    });
    h += '<div class="btns">' + (S.insumos.length ? '<button class="btn sec" data-a="agregar-item">+ Ingrediente</button>' : "") +
      '<button class="btn borde" data-a="nuevo-insumo-receta">+ Insumo nuevo</button></div></div>';

    h += '<div class="card"><h3>Tu trabajo y otros gastos</h3><div class="grid2">' +
      '<label>Horas de trabajo<input id="r-horas" data-r="horas" type="number" inputmode="decimal" step="0.25" value="' + esc(r.horas) + '"></label>' +
      '<label>Valor de tu hora<input id="r-vh" data-r="valorHora" type="number" inputmode="decimal" value="' + esc(r.valorHora) + '" placeholder="' + esc(S.ajustes.valorHora) + ' (de Ajustes)"></label></div>';
    r.extras.forEach(function (e, n) {
      h += '<div class="ing" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr) 36px"><input id="e-n-' + n + '" data-ex="' + n + '" data-k="nombre" value="' + esc(e.nombre) + '" placeholder="Gas, luz, envío" aria-label="Gasto">' +
        '<input id="e-m-' + n + '" data-ex="' + n + '" data-k="monto" type="number" inputmode="decimal" value="' + esc(e.monto) + '" aria-label="Monto">' +
        '<button class="x" data-a="quitar-extra" data-n="' + n + '" aria-label="Quitar">✕</button></div>';
    });
    h += '<button class="btn sec" data-a="agregar-extra">+ Otro gasto</button>' +
      '<label>Ganancia que querés (%)<input id="r-margen" data-r="margen" type="number" inputmode="decimal" value="' + esc(r.margen) + '"></label></div>';

    h += '<div class="card" id="resultado"></div>';
    h += '<div class="btns"><button class="btn" data-a="volver">Listo</button><button class="btn peligro" data-a="borrar-receta">Borrar receta</button></div>';
    $vista.innerHTML = h;
    pintarResultado();
  }

  function pintarResultado() {
    var r = recetaActual(); var box = document.getElementById("resultado"); if (!r || !box) return;
    var c = calc(r);
    var uv = r.unidadVenta || "unidad";
    box.innerHTML = '<p class="muted small">Precio sugerido' + (c.rinde > 1 ? " (entera)" : "") + '</p><span class="precio grande">' + plata(c.precio) + "</span>" +
      (c.rinde > 1 ? '<p><strong>' + plata(c.precioUnidad) + "</strong> por " + esc(uv) + "</p>" : "") +
      '<div class="res"><div class="r"><span>Ingredientes y materiales</span><span>' + plata(c.insumos) + '</span></div>' +
      '<div class="r"><span>Tu trabajo</span><span>' + plata(c.manoObra) + '</span></div>' +
      '<div class="r"><span>Otros gastos</span><span>' + plata(c.extras) + '</span></div>' +
      '<div class="r tot"><span>Costo total</span><span>' + plata(c.total) + "</span></div>" +
      (c.rinde > 1 ? '<div class="r"><span>Costo por ' + esc(uv) + "</span><span>" + plata(c.costoUnidad) + "</span></div>" : "") +
      '<div class="r" style="color:var(--ok)"><span>Ganás</span><span>' + plata(c.ganancia) + "</span></div></div>";
  }

  // ---------- Insumos ----------
  function vInsumos() {
    var h = '<div class="fila"><h2 class="crece">Tus insumos</h2><button class="btn" data-a="nuevo-insumo">+ Nuevo</button></div>' +
      '<p class="small muted">Cargá lo que pagaste y cuánto trae. Cuando algo sube, cambiá el precio acá y todas tus recetas se recalculan.</p><div class="lista">';
    S.insumos.slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre); }).forEach(function (x) {
      h += '<button class="item" data-a="editar-insumo" data-id="' + x.id + '"><span class="crece"><span class="nombre">' + esc(x.nombre) + '</span><br><span class="small muted">' +
        esc(x.cant) + " " + esc(C.UNIDADES[x.unidad] ? C.UNIDADES[x.unidad].nombre : x.unidad) + "</span></span>" +
        '<span class="precio">' + plata(x.precio) + "</span></button>";
    });
    if (!S.insumos.length) h += '<div class="card vacio"><h3>Sin insumos</h3><p class="muted">Ej: Harina, 1 kg, lo que pagaste.</p></div>';
    $vista.innerHTML = h + "</div>";
  }

  function hojaInsumo(insumo, alGuardar) {
    var nuevo = !insumo;
    insumo = insumo || { id: id(), nombre: "", precio: "", cant: 1, unidad: "kg" };
    abrirHoja('<h2>' + (nuevo ? "Nuevo insumo" : "Editar insumo") + "</h2>" +
      '<label>Nombre<input id="h-nombre" value="' + esc(insumo.nombre) + '" placeholder="Ej: Harina 0000"></label>' +
      '<div class="grid3"><label>Pagué<input id="h-precio" type="number" inputmode="decimal" value="' + esc(insumo.precio) + '"></label>' +
      '<label>Trae<input id="h-cant" type="number" inputmode="decimal" value="' + esc(insumo.cant) + '"></label>' +
      '<label>Unidad<select id="h-unidad">' + opciones(UNID_COMPRA, insumo.unidad) + "</select></label></div>" +
      '<div class="btns"><button class="btn" id="h-guardar">Guardar</button>' + (nuevo ? "" : '<button class="btn peligro" id="h-borrar">Borrar</button>') + '<button class="btn borde" data-a="cerrar">Cancelar</button></div>');
    document.getElementById("h-nombre").focus();
    document.getElementById("h-guardar").onclick = function () {
      var nombre = document.getElementById("h-nombre").value.trim();
      var precio = C.num(document.getElementById("h-precio").value);
      var cant = C.num(document.getElementById("h-cant").value);
      var unidad = document.getElementById("h-unidad").value;
      if (!nombre || precio <= 0 || cant <= 0) { toast("Completá nombre, precio y cantidad"); return; }
      var existente = S.insumos.find(function (x) { return x.id === insumo.id; });
      var base = C.UNIDADES[unidad].base;
      var impacto = [];
      if (existente) {
        if (C.UNIDADES[existente.unidad].base !== base) {
          // Cambió de tipo de unidad: las recetas pasan a la unidad compatible.
          S.recetas.forEach(function (r) { r.items.forEach(function (it) { if (it.insumoId === existente.id) it.unidad = unidad; }); });
        }
        var anteriorBase = C.precioBase(existente);
        var tmp = Object.assign({}, existente, { precio: precio, cant: cant, unidad: unidad });
        if (Math.abs(C.precioBase(tmp) - anteriorBase) > 1e-9) {
          // Expresa el nuevo precio en la presentación vieja para medir el impacto.
          var equivalente = C.precioBase(tmp) * C.num(existente.cant) * C.UNIDADES[existente.unidad].factor;
          if (C.UNIDADES[existente.unidad].base === base) impacto = C.impactoCambio(S.recetas, porId(), S.ajustes, existente.id, equivalente);
        }
        Object.assign(existente, tmp, { nombre: nombre, actualizado: Date.now() });
      } else {
        Object.assign(insumo, { nombre: nombre, precio: precio, cant: cant, unidad: unidad, actualizado: Date.now() });
        S.insumos.push(insumo);
      }
      guardar();
      if (alGuardar) { alGuardar(insumo); return; }
      if (impacto.length) hojaImpacto(nombre, impacto); else { cerrarHoja(); render(); toast("Guardado"); }
    };
    var bb = document.getElementById("h-borrar");
    if (bb) bb.onclick = function () {
      var usos = S.recetas.filter(function (r) { return r.items.some(function (it) { return it.insumoId === insumo.id; }); }).length;
      if (usos && bb.getAttribute("data-ok") !== "1") { bb.textContent = "Se usa en " + usos + (usos === 1 ? " receta" : " recetas") + ". Tocá de nuevo para borrar"; bb.setAttribute("data-ok", "1"); return; }
      S.insumos = S.insumos.filter(function (x) { return x.id !== insumo.id; });
      S.recetas.forEach(function (r) { r.items = r.items.filter(function (it) { return it.insumoId !== insumo.id; }); });
      guardar(); cerrarHoja(); render(); toast("Insumo borrado");
    };
  }

  function hojaImpacto(nombre, impacto) {
    var h = "<h2>Cambió " + esc(nombre) + "</h2><p class=\"muted\">Así quedan los precios sugeridos de tus recetas:</p><div class=\"lista\">";
    impacto.forEach(function (x) {
      h += '<div class="card fila"><span class="crece"><strong>' + esc(x.nombre || "Receta sin nombre") + '</strong><br><span class="small muted">antes ' + plata(x.antes) + '</span></span><span class="precio">' + plata(x.despues) + '</span><span class="badge ' + (x.pct > 0 ? "b-up" : "b-ok") + '">' + pct(x.pct) + "</span></div>";
    });
    abrirHoja(h + '</div><div class="btns"><button class="btn" data-a="ir-lista">Mandar lista nueva</button><button class="btn borde" data-a="cerrar-render">Cerrar</button></div>');
  }

  // ---------- Lista de precios ----------
  var seleccion = null;
  function vLista() {
    if (!seleccion) { seleccion = {}; S.recetas.forEach(function (r) { if (!r.ejemplo || S.recetas.length === 1) seleccion[r.id] = true; }); }
    var h = '<h2>Lista de precios</h2><p class="small muted">Elegí qué productos van y compartila por WhatsApp o Instagram.</p><div class="card">';
    if (!S.recetas.length) h += '<p class="muted">Cargá una receta primero.</p>';
    S.recetas.forEach(function (r) {
      h += '<label class="check"><input type="checkbox" id="sel-' + r.id + '" data-sel="' + r.id + '"' + (seleccion[r.id] ? " checked" : "") + "> " + esc(r.nombre || "Receta sin nombre") + "</label>";
    });
    h += '</div><canvas class="prev" id="lienzo" width="1080" height="600" aria-label="Vista previa de la lista"></canvas>' +
      '<div class="btns"><button class="btn" data-a="compartir">Compartir imagen</button><button class="btn sec" data-a="whatsapp-texto">Mandar texto por WhatsApp</button><button class="btn borde" data-a="copiar-texto">Copiar texto</button></div>';
    $vista.innerHTML = h;
    dibujarLista();
  }
  function itemsLista() {
    return S.recetas.filter(function (r) { return seleccion && seleccion[r.id]; }).map(function (r) { return { r: r, c: calc(r) }; });
  }
  function textoLista() {
    var t = "*" + (S.ajustes.negocio || "Lista de precios") + "*\n" + new Date().toLocaleDateString("es-AR") + "\n\n";
    itemsLista().forEach(function (x) {
      t += "• " + (x.r.nombre || "Producto") + ": " + plata(x.c.precio);
      if (x.c.rinde > 1) t += " (" + plata(x.c.precioUnidad) + " por " + (x.r.unidadVenta || "unidad") + ")";
      t += "\n";
    });
    return t;
  }
  function dibujarLista() {
    var cv = document.getElementById("lienzo"); if (!cv) return;
    var items = itemsLista();
    var W = 1080, cab = 250, fila = 120, pie = esPro() ? 60 : 110;
    var H = Math.max(600, cab + items.length * fila + pie + 40);
    cv.width = W; cv.height = H;
    var g = cv.getContext("2d");
    var fuente = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
    g.fillStyle = "#FFF7F9"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#B8325F"; g.fillRect(0, 0, W, cab - 40);
    g.fillStyle = "#FFFFFF"; g.font = "800 64px " + fuente; g.textBaseline = "alphabetic";
    g.fillText(recortar(g, S.ajustes.negocio || "Lista de precios", W - 120), 60, 110);
    g.font = "500 34px " + fuente; g.globalAlpha = .9;
    g.fillText((S.ajustes.negocio ? "Lista de precios · " : "") + new Date().toLocaleDateString("es-AR"), 60, 165); g.globalAlpha = 1;
    var y = cab;
    items.forEach(function (x, n) {
      if (n % 2 === 0) { g.fillStyle = "#FBE9EF"; g.fillRect(40, y - 10, W - 80, fila - 10); }
      g.fillStyle = "#22171C"; g.font = "700 42px " + fuente;
      g.fillText(recortar(g, x.r.nombre || "Producto", 620), 70, y + 50);
      if (x.c.rinde > 1) { g.font = "400 30px " + fuente; g.fillStyle = "#6F5F66"; g.fillText(plata(x.c.precioUnidad) + " por " + (x.r.unidadVenta || "unidad"), 70, y + 92); }
      g.textAlign = "right"; g.fillStyle = "#B8325F"; g.font = "800 50px " + fuente;
      g.fillText(plata(x.c.precio), W - 70, y + 66); g.textAlign = "left";
      y += fila;
    });
    if (!items.length) { g.fillStyle = "#6F5F66"; g.font = "500 36px " + fuente; g.fillText("Elegí al menos un producto", 70, cab + 60); }
    if (!esPro()) { g.fillStyle = "#9A8790"; g.font = "500 28px " + fuente; g.textAlign = "center"; g.fillText("Hecho con Cuánto Cobro", W / 2, H - 50); g.textAlign = "left"; }
  }
  function recortar(g, txt, max) {
    if (g.measureText(txt).width <= max) return txt;
    while (txt.length > 1 && g.measureText(txt + "…").width > max) txt = txt.slice(0, -1);
    return txt + "…";
  }
  function compartirImagen() {
    var cv = document.getElementById("lienzo"); if (!cv) return;
    cv.toBlob(function (blob) {
      if (!blob) { toast("No se pudo crear la imagen"); return; }
      var archivo = new File([blob], "lista-de-precios.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        navigator.share({ files: [archivo], text: textoLista() }).catch(function () {});
      } else {
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "lista-de-precios.png";
        document.body.appendChild(a); a.click(); a.remove();
        toast("Imagen descargada");
      }
    }, "image/png");
  }

  // ---------- Ajustes ----------
  function vAjustes() {
    var a = S.ajustes;
    var h = '<h2>Ajustes</h2><div class="card">' +
      '<label>Nombre de tu emprendimiento<input id="a-negocio" data-aj="negocio" value="' + esc(a.negocio) + '" placeholder="Aparece en tu lista de precios"></label>' +
      '<div class="grid2"><label>Moneda<select id="a-moneda" data-aj="moneda">' + opciones(MONEDAS.map(function (m) { return [m[0], m[0] + " · " + m[1]]; }), a.moneda) + "</select></label>" +
      '<label>Redondear precios a<select id="a-redondeo" data-aj="redondeo">' + opciones([[0, "No redondear"], [1, "1"], [10, "10"], [50, "50"], [100, "100"], [500, "500"], [1000, "1.000"]], a.redondeo) + "</select></label></div>" +
      '<div class="grid2"><label>Valor de tu hora<input id="a-vh" data-aj="valorHora" type="number" inputmode="decimal" value="' + esc(a.valorHora) + '"></label>' +
      '<label>Ganancia por defecto (%)<input id="a-margen" data-aj="margen" type="number" inputmode="decimal" value="' + esc(a.margen) + '"></label></div>' +
      '<p class="small muted">¿Cuánto vale tu hora? Pensá cuánto querés ganar por mes y dividilo por las horas que trabajás.</p></div>';
    h += '<div class="card"><h3>Plan</h3>';
    if (esPro()) h += '<p><span class="badge b-ok">PRO activo</span> Recetas ilimitadas y lista sin marca de agua.</p><p class="small muted">Código: ' + esc(S.pro.codigo) + "</p>";
    else h += '<p>Estás usando la versión gratis: ' + (CFG.recetasGratis || 2) + ' recetas propias.</p>' +
      '<label>¿Ya compraste? Ingresá tu código<input id="a-codigo" placeholder="CC-XXXX-XXXX" autocapitalize="characters"></label>' +
      '<div class="btns"><button class="btn" data-a="activar">Activar</button><button class="btn sec" data-a="comprar">Comprar PRO</button></div>';
    h += '</div><div class="card"><h3>Copia de seguridad</h3><p class="small muted">Tus datos se guardan solo en este teléfono. Guardá una copia para no perderlos o pasarlos a otro.</p>' +
      '<div class="btns"><button class="btn sec" data-a="exportar">Guardar copia</button><label class="btn borde" style="flex-direction:row;justify-content:center;color:var(--fg)">Cargar copia<input type="file" id="a-importar" accept="application/json,.json" hidden></label></div>' +
      '<button class="btn peligro" data-a="borrar-todo">Borrar todo y empezar de cero</button></div>';
    $vista.innerHTML = h;
  }

  function normalizarCodigo(s) { return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function activar() {
    var inp = document.getElementById("a-codigo"); var cod = normalizarCodigo(inp && inp.value);
    if (cod.length < 10) { toast("El código tiene la forma CC-XXXX-XXXX"); return; }
    if (!window.crypto || !crypto.subtle) { toast("Abrí la app desde su link https para activar"); return; }
    crypto.subtle.digest("SHA-256", new TextEncoder().encode("cuantocobro:" + cod)).then(function (buf) {
      var hex = Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("").slice(0, 16);
      if ((window.CC_CODES || []).indexOf(hex) >= 0) {
        S.pro = { ok: true, codigo: inp.value.trim().toUpperCase() }; guardar(); render(); toast("¡Listo! PRO activado");
      } else toast("Ese código no es válido. Revisalo o escribinos");
    });
  }

  function hojaComprar(motivo) {
    var precioAR = CFG.lanzamientoActivo ? CFG.precioLanzamientoAR : CFG.precioAR;
    var precioUSD = CFG.lanzamientoActivo ? CFG.precioLanzamientoUSD : CFG.precioUSD;
    var ar = REG.ar;
    var h = "<h2>" + (ar ? "Pasá" : "Pásate") + " a Cuánto Cobro PRO</h2>" + (motivo ? '<p class="muted">' + esc(motivo) + "</p>" : "") +
      "<ul><li>Recetas ilimitadas</li><li>Lista de precios sin marca de agua</li><li>Pago único, es tuyo para siempre</li></ul>";
    if (ar) {
      h += '<p><span class="precio grande">' + esc(precioAR) + "</span>" + (CFG.lanzamientoActivo ? ' <s class="muted">' + esc(CFG.precioAR) + "</s>" : "") + "</p>";
      if (CFG.linkPagoAR) h += '<a class="btn ancho" href="' + esc(CFG.linkPagoAR) + '" target="_blank" rel="noopener">Pagar con Mercado Pago</a>';
      if (CFG.aliasMP || CFG.aliasNX) {
        h += '<div class="card"><p class="small muted">' + (CFG.linkPagoAR ? "O transferí" : "Transferí") + " a cualquiera de estos alias" + (CFG.titularAlias ? " (a nombre de " + esc(CFG.titularAlias) + ")" : "") + ":</p>";
        if (CFG.aliasMP) h += '<p class="small">Mercado Pago</p><div class="copiar">' + esc(CFG.aliasMP) + '</div><button class="btn sec" data-a="copiar-alias" data-v="' + esc(CFG.aliasMP) + '">Copiar alias Mercado Pago</button>';
        if (CFG.aliasNX) h += '<p class="small">Naranja X</p><div class="copiar">' + esc(CFG.aliasNX) + '</div><button class="btn sec" data-a="copiar-alias" data-v="' + esc(CFG.aliasNX) + '">Copiar alias Naranja X</button>';
        h += "</div>";
      }
      if (CFG.whatsappVentas) h += '<a class="btn borde ancho" href="https://wa.me/' + esc(CFG.whatsappVentas) + "?text=" + encodeURIComponent("Hola! Ya pagué Cuánto Cobro PRO, te mando el comprobante para recibir mi código.") + '" target="_blank" rel="noopener">Ya pagué: pedir mi código por WhatsApp</a>' +
        '<p class="small muted">Mandá el comprobante y te respondemos con tu código. Lo ingresás en Ajustes.</p>';
      if (CFG.linkPagoInternacional) h += '<p class="small muted">¿Estás en otro país? <a href="' + esc(CFG.linkPagoInternacional) + '" target="_blank" rel="noopener">Pagá ' + esc(precioUSD) + " con tarjeta</a>.</p>";
    } else {
      h += '<p><span class="precio grande">' + esc(precioUSD) + "</span>" + (CFG.lanzamientoActivo ? ' <s class="muted">' + esc(CFG.precioUSD) + "</s>" : "") + ' <span class="small muted">pago único, en tu moneda</span></p>';
      if (CFG.linkPagoInternacional) h += '<a class="btn ancho" href="' + esc(CFG.linkPagoInternacional) + '" target="_blank" rel="noopener">Comprar ahora</a>' +
        '<p class="small muted">Pagas con tarjeta o con los medios locales de tu país. Tu código llega por correo después de la compra. Lo ingresas en Ajustes.</p>';
      if (CFG.whatsappVentas) h += '<a class="btn ' + (CFG.linkPagoInternacional ? "borde" : "") + ' ancho" href="https://wa.me/' + esc(CFG.whatsappVentas) + "?text=" + encodeURIComponent("¡Hola! Quiero Cuánto Cobro PRO. " + (CFG.linkPagoInternacional ? "Ya compré y no me llegó el código." : "¿Cómo lo pago desde mi país?")) + '" target="_blank" rel="noopener">' + (CFG.linkPagoInternacional ? "¿No te llegó el código? Escríbenos" : "Escríbenos por WhatsApp para comprar") + "</a>";
      h += '<p class="small muted">¿Estás en Argentina? <a href="?pais=ar">Ver precio en pesos</a>.</p>';
    }
    if (!CFG.linkPagoAR && !CFG.aliasMP && !CFG.aliasNX && !CFG.whatsappVentas && !CFG.linkPagoInternacional) h += '<p class="muted">Muy pronto vas a poder comprarlo desde acá.</p>';
    abrirHoja(h + '<button class="btn borde" data-a="cerrar">Ahora no</button>');
  }

  // ---------- Hoja inferior ----------
  function abrirHoja(html) { $hoja.innerHTML = '<div class="hoja-in" role="dialog" aria-modal="true">' + html + "</div>"; $hoja.hidden = false; }
  function cerrarHoja() { $hoja.hidden = true; $hoja.innerHTML = ""; }
  $hoja.addEventListener("click", function (e) { if (e.target === $hoja) cerrarHoja(); });

  // ---------- Eventos ----------
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-ir],[data-a]"); if (!t) return;
    if (t.hasAttribute("data-ir")) { ir(t.getAttribute("data-ir")); return; }
    var a = t.getAttribute("data-a"); var r = recetaActual();
    if (t.tagName === "A" && t.getAttribute("href") === "#") e.preventDefault();
    switch (a) {
      case "nueva-receta": nuevaReceta(); break;
      case "abrir-receta": ir("receta", { recetaId: t.getAttribute("data-id") }); break;
      case "volver": ir("recetas"); break;
      case "ya-actualice": fijarPublicados(); guardar(); render(); toast("Precios actualizados"); break;
      case "agregar-item":
        var primero = S.insumos.slice().sort(function (x, y) { return x.nombre.localeCompare(y.nombre); })[0];
        r.items.push({ insumoId: primero.id, cant: "", unidad: C.compatibles(primero.unidad)[0] === "g" ? "g" : C.compatibles(primero.unidad)[0] });
        tocoReceta(); vReceta(); var inps = $vista.querySelectorAll('[data-k="insumoId"]'); if (inps.length) inps[inps.length - 1].focus(); break;
      case "quitar-item": r.items.splice(+t.getAttribute("data-n"), 1); tocoReceta(); vReceta(); break;
      case "agregar-extra": r.extras.push({ nombre: "", monto: "" }); tocoReceta(); vReceta(); break;
      case "quitar-extra": r.extras.splice(+t.getAttribute("data-n"), 1); tocoReceta(); vReceta(); break;
      case "nuevo-insumo-receta":
        hojaInsumo(null, function (ins) {
          var u = C.UNIDADES[ins.unidad].base; r.items.push({ insumoId: ins.id, cant: "", unidad: u === "u" ? "u" : u });
          tocoReceta(); cerrarHoja(); vReceta();
        }); break;
      case "borrar-receta":
        if (t.getAttribute("data-ok") !== "1") { t.textContent = "Tocá de nuevo para borrar"; t.setAttribute("data-ok", "1"); return; }
        S.recetas = S.recetas.filter(function (x) { return x.id !== r.id; }); guardar(); ir("recetas"); toast("Receta borrada"); break;
      case "nuevo-insumo": hojaInsumo(null); break;
      case "editar-insumo": hojaInsumo(S.insumos.find(function (x) { return x.id === t.getAttribute("data-id"); })); break;
      case "cerrar": cerrarHoja(); break;
      case "cerrar-render": cerrarHoja(); render(); break;
      case "ir-lista": seleccion = null; ir("lista"); break;
      case "compartir": compartirImagen(); break;
      case "copiar-texto": copiar(textoLista(), "Lista copiada"); break;
      case "whatsapp-texto": window.open("https://wa.me/?text=" + encodeURIComponent(textoLista()), "_blank"); break;
      case "comprar": hojaComprar(); break;
      case "copiar-alias": copiar(t.getAttribute("data-v"), "Alias copiado"); break;
      case "activar": activar(); break;
      case "exportar":
        var blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
        var l = document.createElement("a"); l.href = URL.createObjectURL(blob); l.download = "cuanto-cobro-copia-" + new Date().toISOString().slice(0, 10) + ".json";
        document.body.appendChild(l); l.click(); l.remove(); toast("Copia guardada"); break;
      case "borrar-todo":
        if (t.getAttribute("data-ok") !== "1") { t.textContent = "Se borran recetas e insumos. Tocá de nuevo"; t.setAttribute("data-ok", "1"); return; }
        var pro = S.pro; S = ejemplo(); S.pro = pro; S.recetas = []; S.insumos = []; guardar(); ir("recetas"); break;
    }
  });

  function tocoReceta() { var r = recetaActual(); if (r) { r.precioPublicado = calc(r).precio; guardar(); } }

  document.addEventListener("input", function (e) {
    var el = e.target, r = recetaActual();
    if (el.hasAttribute("data-r") && r) { r[el.getAttribute("data-r")] = el.type === "number" ? (el.value === "" ? "" : C.num(el.value)) : el.value; tocoReceta(); pintarResultado(); }
    else if (el.hasAttribute("data-it") && r) {
      var it = r.items[+el.getAttribute("data-it")], k = el.getAttribute("data-k");
      it[k] = k === "cant" ? C.num(el.value) : el.value;
      if (k === "insumoId") { var ins = porId()[el.value]; it.unidad = C.compatibles(ins.unidad)[0]; tocoReceta(); vReceta(); return; }
      tocoReceta(); pintarResultado();
    }
    else if (el.hasAttribute("data-ex") && r) { var ex = r.extras[+el.getAttribute("data-ex")]; ex[el.getAttribute("data-k")] = el.getAttribute("data-k") === "monto" ? C.num(el.value) : el.value; tocoReceta(); pintarResultado(); }
    else if (el.hasAttribute("data-aj")) {
      var k2 = el.getAttribute("data-aj");
      S.ajustes[k2] = (k2 === "negocio" || k2 === "moneda") ? el.value : C.num(el.value);
      if (k2 === "redondeo" || k2 === "moneda" || k2 === "valorHora") fijarPublicados();
      guardar(); if (k2 === "negocio") document.getElementById("titulo").textContent = el.value || CFG.marca;
    }
    else if (el.hasAttribute("data-sel")) { seleccion[el.getAttribute("data-sel")] = el.checked; dibujarLista(); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.id !== "a-importar" || !e.target.files[0]) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var d = JSON.parse(fr.result);
        if (!d.insumos || !d.recetas) throw new Error("formato");
        var pro = S.pro; S = d; if (pro && pro.ok) S.pro = pro; guardar(); seleccion = null; ir("recetas"); toast("Copia cargada");
      } catch (err) { toast("Ese archivo no es una copia de Cuánto Cobro"); }
    };
    fr.readAsText(e.target.files[0]);
  });

  cargar();
  render();
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});
})();
