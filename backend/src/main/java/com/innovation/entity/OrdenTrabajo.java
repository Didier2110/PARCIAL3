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
@Document(collection = "ordenes_trabajo")
public class OrdenTrabajo {

    @Id
    private String id;

    // Relaciones
    private String clienteId;
    private String tecnicoId;           // asignado por JEFE_CUADRILLA
    private String jefeCuadrillaId;     // quien creó/asignó la orden

    // Tipo y descripción
    private String tipo;                // INSTALACION, MANTENIMIENTO, AVERIA, RETIRO, TRASLADO
    private String titulo;
    private String descripcion;

    // Dirección de ejecución
    private String direccion;
    private String ciudad;
    private String referencia;          // punto de referencia para llegar

    // Servicio vinculado
    private String suscripcionId;
    private String planInternet;        // nombre del plan contratado
    private Boolean incluyeTv;

    // Estado y flujo
    private String estado;             // PENDIENTE, ASIGNADA, EN_PROGRESO, COMPLETADA, RECHAZADA, CANCELADA
    private LocalDateTime fechaProgramada;
    private LocalDateTime fechaInicio;  // cuando el técnico inicia
    private LocalDateTime fechaCierre;  // cuando cierra el técnico
    private LocalDateTime fechaValidacion; // cuando el jefe valida

    // Fases de trabajo (actualizadas por el técnico)
    private List<FaseTrabajo> fases;

    // Fotos cargadas por el técnico (IDs de GridFS)
    private List<String> fotosIds;

    // Observaciones
    private String observacionesTecnico;
    private String observacionesJefe;   // para aprobar o rechazar

    // Materiales
    private List<String> solicitudesMaterialIds;

    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    // ===== Clase embebida: fase de trabajo =====
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FaseTrabajo {
        private String nombre;
        private String descripcion;
        private String estado;          // PENDIENTE, EN_PROGRESO, COMPLETADA
        private LocalDateTime fechaCompletado;
        private String observaciones;
        private Integer orden;
    }
}
