package com.innovation.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.innovation.entity.SolicitudMaterial;
import com.innovation.entity.SolicitudMaterial.ItemSolicitud;
import com.innovation.service.SolicitudMaterialService;

@RestController
@RequestMapping("/api/v1/solicitudes-material")
public class SolicitudMaterialController {

    @Autowired
    private SolicitudMaterialService solicitudService;

    @PreAuthorize("hasAnyRole('TECNICO','JEFE_CUADRILLA','ADMIN')")
    @PostMapping
    public ResponseEntity<SolicitudMaterial> crear(@RequestBody SolicitudMaterial solicitud) {
        return ResponseEntity.ok(solicitudService.crearSolicitud(solicitud));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA','JEFE_CUADRILLA')")
    @GetMapping
    public ResponseEntity<List<SolicitudMaterial>> listar() {
        return ResponseEntity.ok(solicitudService.obtenerTodas());
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA','JEFE_CUADRILLA','TECNICO')")
    @GetMapping("/{id}")
    public ResponseEntity<SolicitudMaterial> obtener(@PathVariable String id) {
        return ResponseEntity.ok(solicitudService.obtenerPorId(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA','JEFE_CUADRILLA','TECNICO')")
    @GetMapping("/tecnico/{tecnicoId}")
    public ResponseEntity<List<SolicitudMaterial>> porTecnico(@PathVariable String tecnicoId) {
        return ResponseEntity.ok(solicitudService.obtenerPorTecnico(tecnicoId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','JEFE_BODEGA','JEFE_CUADRILLA')")
    @GetMapping("/pendientes")
    public ResponseEntity<List<SolicitudMaterial>> pendientes() {
        return ResponseEntity.ok(solicitudService.obtenerPendientes());
    }

    /**
     * JEFE_BODEGA aprueba con cantidades aprobadas.
     * body: { jefeBodegaId, items: [...], observaciones }
     */
    @PreAuthorize("hasAnyRole('JEFE_BODEGA','ADMIN')")
    @PutMapping("/{id}/aprobar")
    public ResponseEntity<SolicitudMaterial> aprobar(@PathVariable String id,
                                                     @RequestBody Map<String, Object> body) {
        String jefeBodegaId = (String) body.get("jefeBodegaId");
        String observaciones = body.containsKey("observaciones") ? (String) body.get("observaciones") : "";

        @SuppressWarnings("unchecked")
        List<ItemSolicitud> items = (List<ItemSolicitud>) body.get("items");
        // Deserialization workaround: Jackson puede necesitar mapeo manual
        // Para simplificar, pasamos las cantidades directamente a través del DTO
        return ResponseEntity.ok(solicitudService.aprobarSolicitud(id, jefeBodegaId, items, observaciones));
    }

    /** JEFE_BODEGA rechaza. body: { jefeBodegaId, observaciones } */
    @PreAuthorize("hasAnyRole('JEFE_BODEGA','ADMIN')")
    @PutMapping("/{id}/rechazar")
    public ResponseEntity<SolicitudMaterial> rechazar(@PathVariable String id,
                                                      @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
            solicitudService.rechazarSolicitud(id, body.get("jefeBodegaId"), body.getOrDefault("observaciones", ""))
        );
    }

    /** JEFE_BODEGA despacha físicamente. body: { numeroDespachoPor } */
    @PreAuthorize("hasAnyRole('JEFE_BODEGA','ADMIN')")
    @PutMapping("/{id}/despachar")
    public ResponseEntity<SolicitudMaterial> despachar(@PathVariable String id,
                                                       @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
            solicitudService.despacharSolicitud(id, body.getOrDefault("numeroDespachoPor", ""))
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        solicitudService.eliminarSolicitud(id);
        return ResponseEntity.noContent().build();
    }
}
