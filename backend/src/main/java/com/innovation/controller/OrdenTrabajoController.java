package com.innovation.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.innovation.entity.OrdenTrabajo;
import com.innovation.service.OrdenTrabajoService;

@RestController
@RequestMapping("/api/v1/ordenes")
public class OrdenTrabajoController {

    @Autowired
    private OrdenTrabajoService ordenService;

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_CUADRILLA','VENDEDOR','PUNTO_VENTA')")
    @PostMapping
    public ResponseEntity<OrdenTrabajo> crear(@RequestBody OrdenTrabajo orden) {
        return ResponseEntity.ok(ordenService.crearOrden(orden));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_CUADRILLA')")
    @GetMapping
    public ResponseEntity<List<OrdenTrabajo>> listar() {
        return ResponseEntity.ok(ordenService.obtenerTodas());
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_CUADRILLA','TECNICO')")
    @GetMapping("/{id}")
    public ResponseEntity<OrdenTrabajo> obtener(@PathVariable String id) {
        return ResponseEntity.ok(ordenService.obtenerPorId(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_CUADRILLA','TECNICO')")
    @GetMapping("/tecnico/{tecnicoId}")
    public ResponseEntity<List<OrdenTrabajo>> porTecnico(@PathVariable String tecnicoId) {
        return ResponseEntity.ok(ordenService.obtenerPorTecnico(tecnicoId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_CUADRILLA','VENDEDOR','PUNTO_VENTA')")
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<OrdenTrabajo>> porCliente(@PathVariable String clienteId) {
        return ResponseEntity.ok(ordenService.obtenerPorCliente(clienteId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_CUADRILLA')")
    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<OrdenTrabajo>> porEstado(@PathVariable String estado) {
        return ResponseEntity.ok(ordenService.obtenerPorEstado(estado));
    }

    /** Semana: ?inicio=2025-01-01T00:00:00&fin=2025-01-07T23:59:59 */
    @PreAuthorize("hasAnyRole('ADMIN','JEFE_CUADRILLA')")
    @GetMapping("/semana")
    public ResponseEntity<List<OrdenTrabajo>> porSemana(
            @RequestParam LocalDateTime inicio,
            @RequestParam LocalDateTime fin) {
        return ResponseEntity.ok(ordenService.obtenerPorSemana(inicio, fin));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_CUADRILLA','TECNICO')")
    @GetMapping("/tecnico/{tecnicoId}/semana")
    public ResponseEntity<List<OrdenTrabajo>> porTecnicoYSemana(
            @PathVariable String tecnicoId,
            @RequestParam LocalDateTime inicio,
            @RequestParam LocalDateTime fin) {
        return ResponseEntity.ok(ordenService.obtenerPorTecnicoYSemana(tecnicoId, inicio, fin));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_CUADRILLA')")
    @PutMapping("/{id}")
    public ResponseEntity<OrdenTrabajo> actualizar(@PathVariable String id,
                                                   @RequestBody OrdenTrabajo datos) {
        return ResponseEntity.ok(ordenService.actualizarOrden(id, datos));
    }

    /** JEFE_CUADRILLA asigna técnico */
    @PreAuthorize("hasAnyRole('JEFE_CUADRILLA','ADMIN')")
    @PutMapping("/{id}/asignar")
    public ResponseEntity<OrdenTrabajo> asignar(@PathVariable String id,
                                                @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ordenService.asignarTecnico(id, body.get("tecnicoId")));
    }

    /** TECNICO inicia la orden */
    @PreAuthorize("hasAnyRole('TECNICO','ADMIN')")
    @PutMapping("/{id}/iniciar")
    public ResponseEntity<OrdenTrabajo> iniciar(@PathVariable String id) {
        return ResponseEntity.ok(ordenService.iniciarOrden(id));
    }

    /** TECNICO actualiza una fase  body: { indice: 0, estado: "COMPLETADA", observaciones: "..." } */
    @PreAuthorize("hasAnyRole('TECNICO','ADMIN')")
    @PutMapping("/{id}/fases")
    public ResponseEntity<OrdenTrabajo> actualizarFase(@PathVariable String id,
                                                       @RequestBody Map<String, Object> body) {
        int indice = Integer.parseInt(body.get("indice").toString());
        String estado = (String) body.get("estado");
        String obs = body.containsKey("observaciones") ? (String) body.get("observaciones") : "";
        return ResponseEntity.ok(ordenService.actualizarFase(id, indice, estado, obs));
    }

    /** TECNICO cierra la orden  body: { observaciones: "..." } */
    @PreAuthorize("hasAnyRole('TECNICO','ADMIN')")
    @PutMapping("/{id}/cerrar")
    public ResponseEntity<OrdenTrabajo> cerrar(@PathVariable String id,
                                               @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ordenService.cerrarOrden(id, body.getOrDefault("observaciones", "")));
    }

    /** JEFE_CUADRILLA valida o rechaza  body: { aprobada: true, observaciones: "..." } */
    @PreAuthorize("hasAnyRole('JEFE_CUADRILLA','ADMIN')")
    @PutMapping("/{id}/validar")
    public ResponseEntity<OrdenTrabajo> validar(@PathVariable String id,
                                                @RequestBody Map<String, Object> body) {
        boolean aprobada = Boolean.parseBoolean(body.get("aprobada").toString());
        String obs = body.containsKey("observaciones") ? (String) body.get("observaciones") : "";
        return ResponseEntity.ok(ordenService.validarOrden(id, aprobada, obs));
    }

    /** Agrega foto (ID de GridFS)  body: { fotoId: "..." } */
    @PreAuthorize("hasAnyRole('TECNICO','ADMIN')")
    @PostMapping("/{id}/fotos")
    public ResponseEntity<OrdenTrabajo> agregarFoto(@PathVariable String id,
                                                    @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ordenService.agregarFoto(id, body.get("fotoId")));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        ordenService.eliminarOrden(id);
        return ResponseEntity.noContent().build();
    }
}
