// Fórmulas de costo y precio. Sin dependencias del navegador para poder probarlas con node.
(function (root) {
  // Cada unidad se lleva a una unidad base: gramos, mililitros o unidades.
  var UNIDADES = {
    g: { base: "g", factor: 1, nombre: "g" },
    kg: { base: "g", factor: 1000, nombre: "kg" },
    ml: { base: "ml", factor: 1, nombre: "ml" },
    l: { base: "ml", factor: 1000, nombre: "litro" },
    cc: { base: "ml", factor: 1, nombre: "cc" },
    u: { base: "u", factor: 1, nombre: "unidad" },
    doc: { base: "u", factor: 12, nombre: "docena" }
  };

  function compatibles(unidad) {
    var base = (UNIDADES[unidad] || UNIDADES.u).base;
    return Object.keys(UNIDADES).filter(function (k) { return UNIDADES[k].base === base; });
  }

  function num(x) {
    var n = typeof x === "number" ? x : parseFloat(String(x == null ? "" : x).replace(",", "."));
    return isFinite(n) ? n : 0;
  }

  // Precio de una unidad base (por gramo, por ml o por unidad).
  function precioBase(insumo) {
    var u = UNIDADES[insumo.unidad] || UNIDADES.u;
    var cantBase = num(insumo.cant) * u.factor;
    return cantBase > 0 ? num(insumo.precio) / cantBase : 0;
  }

  function costoItem(item, insumo) {
    if (!insumo) return 0;
    var u = UNIDADES[item.unidad] || UNIDADES[insumo.unidad] || UNIDADES.u;
    if (u.base !== (UNIDADES[insumo.unidad] || UNIDADES.u).base) return 0;
    return num(item.cant) * u.factor * precioBase(insumo);
  }

  function redondear(valor, paso) {
    paso = num(paso);
    if (paso <= 0) return Math.round(valor * 100) / 100;
    return Math.ceil(valor / paso) * paso;
  }

  // insumosPorId: { id: insumo }. ajustes: { valorHora, redondeo }.
  function calcularReceta(receta, insumosPorId, ajustes, preciosOverride) {
    ajustes = ajustes || {};
    var insumos = 0, detalle = [];
    (receta.items || []).forEach(function (it) {
      var ins = insumosPorId[it.insumoId];
      if (ins && preciosOverride && preciosOverride[ins.id] != null) {
        ins = Object.assign({}, ins, { precio: preciosOverride[ins.id] });
      }
      var c = costoItem(it, ins);
      insumos += c;
      detalle.push({ insumoId: it.insumoId, nombre: ins ? ins.nombre : "(borrado)", costo: c });
    });
    var valorHora = receta.valorHora != null && receta.valorHora !== "" ? num(receta.valorHora) : num(ajustes.valorHora);
    var manoObra = num(receta.horas) * valorHora;
    var extras = (receta.extras || []).reduce(function (s, e) { return s + num(e.monto); }, 0);
    var total = insumos + manoObra + extras;
    var rinde = Math.max(1, num(receta.rinde) || 1);
    var margen = num(receta.margen);
    var precioSinRedondeo = total * (1 + margen / 100);
    var paso = num(ajustes.redondeo);
    var precioUnidad = redondear(precioSinRedondeo / rinde, paso);
    var precio = rinde > 1 ? redondear(precioSinRedondeo, paso) : precioUnidad;
    return {
      insumos: insumos, manoObra: manoObra, extras: extras, total: total,
      costoUnidad: total / rinde, rinde: rinde,
      precio: precio, precioUnidad: precioUnidad,
      ganancia: precio - total, detalle: detalle
    };
  }

  // Compara el precio sugerido de cada receta antes y después de cambiar el precio de un insumo.
  function impactoCambio(recetas, insumosPorId, ajustes, insumoId, precioNuevo) {
    var override = {}; override[insumoId] = precioNuevo;
    return recetas
      .filter(function (r) { return (r.items || []).some(function (it) { return it.insumoId === insumoId; }); })
      .map(function (r) {
        var antes = calcularReceta(r, insumosPorId, ajustes).precio;
        var despues = calcularReceta(r, insumosPorId, ajustes, override).precio;
        return { id: r.id, nombre: r.nombre, antes: antes, despues: despues, pct: antes > 0 ? (despues - antes) / antes * 100 : 0 };
      });
  }

  var api = { UNIDADES: UNIDADES, compatibles: compatibles, num: num, precioBase: precioBase, costoItem: costoItem,
    redondear: redondear, calcularReceta: calcularReceta, impactoCambio: impactoCambio };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.CCCalc = api;
})(this);
