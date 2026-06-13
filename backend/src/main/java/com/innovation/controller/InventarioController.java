package com.innovation.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.innovation.entity.Inventario;
import com.innovation.service.InventarioService;

@RestController
@RequestMapping("/api/v1/inventario")
public class InventarioController {

    @Autowired
    private InventarioService inventarioService;

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA')")
    @PostMapping
    public ResponseEntity<Inventario> crear(@RequestBody Inventario item) {
        return ResponseEntity.ok(inventarioService.crearItem(item));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA','JEFE_CUADRILLA')")
    @GetMapping
    public ResponseEntity<List<Inventario>> listar() {
        return ResponseEntity.ok(inventarioService.obtenerTodos());
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA','JEFE_CUADRILLA')")
    @GetMapping("/{id}")
    public ResponseEntity<Inventario> obtener(@PathVariable String id) {
        return ResponseEntity.ok(inventarioService.obtenerPorId(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA','JEFE_CUADRILLA')")
    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<Inventario>> porCategoria(@PathVariable String categoria) {
        return ResponseEntity.ok(inventarioService.obtenerPorCategoria(categoria));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA','JEFE_CUADRILLA')")
    @GetMapping("/stock-bajo")
    public ResponseEntity<List<Inventario>> stockBajo() {
        return ResponseEntity.ok(inventarioService.obtenerStockBajo());
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA')")
    @PutMapping("/{id}")
    public ResponseEntity<Inventario> actualizar(@PathVariable String id,
                                                 @RequestBody Inventario datos) {
        return ResponseEntity.ok(inventarioService.actualizarItem(id, datos));
    }

    /**
     * Ajusta stock. body: { delta: -5, motivo: "Despacho #123" }
     * Valida que no baje de cero.
     */
    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA')")
    @PutMapping("/{id}/stock")
    public ResponseEntity<Inventario> ajustarStock(@PathVariable String id,
                                                   @RequestBody Map<String, Object> body) {
        int delta = Integer.parseInt(body.get("delta").toString());
        String motivo = body.containsKey("motivo") ? (String) body.get("motivo") : "";
        return ResponseEntity.ok(inventarioService.ajustarStock(id, delta, motivo));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        inventarioService.eliminarItem(id);
        return ResponseEntity.noContent().build();
    }
}
