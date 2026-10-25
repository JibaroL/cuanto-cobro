const assert = require("assert");
const C = require("../calc.js");
const ins = {
  harina: { id: "harina", nombre: "Harina", precio: 1200, cant: 1, unidad: "kg" },
  manteca: { id: "manteca", nombre: "Manteca", precio: 2250, cant: 250, unidad: "g" },
  huevo: { id: "huevo", nombre: "Huevos", precio: 3000, cant: 1, unidad: "doc" },
  leche: { id: "leche", nombre: "Leche", precio: 1500, cant: 1, unidad: "l" }
};
// Torta: 500 g harina (600) + 250 g manteca (2250) + 6 huevos (1500) = 4350; + 2 h x 3000 = 6000; + caja 800 => 11150
const torta = { id: "t", nombre: "Torta", rinde: 12, horas: 2, margen: 40,
  items: [{ insumoId: "harina", cant: 500, unidad: "g" }, { insumoId: "manteca", cant: 250, unidad: "g" }, { insumoId: "huevo", cant: 6, unidad: "u" }],
  extras: [{ nombre: "Caja", monto: 800 }] };
let r = C.calcularReceta(torta, ins, { valorHora: 3000, redondeo: 0 });
assert.strictEqual(Math.round(r.insumos), 4350);
assert.strictEqual(r.manoObra, 6000);
assert.strictEqual(Math.round(r.total), 11150);
assert.strictEqual(Math.round(r.precio), 15610);
// Redondeo a 100 hacia arriba
r = C.calcularReceta(torta, ins, { valorHora: 3000, redondeo: 100 });
assert.strictEqual(r.precio, 15700);
assert.strictEqual(r.precioUnidad, 1400); // 15610/12 = 1300.8 -> 1400
// Litros y cc
const flan = { id: "f", nombre: "Flan", rinde: 1, horas: 0, margen: 0, items: [{ insumoId: "leche", cant: 500, unidad: "ml" }] };
assert.strictEqual(C.calcularReceta(flan, ins, {}).precio, 750);
// Unidad incompatible no suma
assert.strictEqual(C.costoItem({ insumoId: "leche", cant: 2, unidad: "kg" }, ins.leche), 0);
// Impacto de suba
const imp = C.impactoCambio([torta, flan], ins, { valorHora: 3000, redondeo: 0 }, "manteca", 2250 * 1.2);
assert.strictEqual(imp.length, 1);
assert.ok(Math.abs(imp[0].despues - imp[0].antes - 450 * 1.4) < 0.01);
// Valor hora propio de la receta tiene prioridad
assert.strictEqual(C.calcularReceta(Object.assign({}, torta, { valorHora: 0 }), ins, { valorHora: 3000 }).manoObra, 0);
console.log("OK: todas las pruebas de fórmulas pasaron");
