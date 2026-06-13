package com.innovation.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "solicitudes_material")
public class SolicitudMaterial {

    @Id
    private String id;

    private String tecnicoId;
    private String ordenTrabajoId;
    private String jefeBodegaId;    // quien aprueba/despacha

    private List<ItemSolicitud> items;

    // PENDIENTE → APROBADA → DESPACHADA | RECHAZADA
    private String estado;

    private String motivoSolicitud;
    private String observacionesBodega;
    private String numeroDespachoPor; // número de despacho o remisión

    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaRespuesta;
    private LocalDateTime fechaDespacho;

    // ===== Clase embebida: ítem solicitado =====
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemSolicitud {
        private String inventarioId;
        private String nombreItem;
        private Integer cantidadSolicitada;
        private Integer cantidadAprobada;
        private String numeroSerie;     // si aplica
        private String observacion;
    }
}
