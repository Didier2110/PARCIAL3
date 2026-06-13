package com.innovation.entity;

import java.time.LocalDateTime;

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
@Document(collection = "inventario")
public class Inventario {

    @Id
    private String id;

    private String nombre;
    private String descripcion;
    private String categoria;       // CABLE, ROUTER, FIBRA, CONECTOR, HERRAMIENTA, OTRO
    private String unidad;          // unidad de medida: metros, unidades, rollos

    // Stock — la validación impide que baje de cero
    private Integer cantidad;
    @Builder.Default
    private Integer cantidadMinima = 0;  // umbral de alerta
    private Integer cantidadReservada;   // reservada para solicitudes aprobadas

    // Control de series individuales (para equipos con número de serie)
    private Boolean tieneSerie;
    private String numeroSerie;     // si es unidad serializada
    private String estado;          // DISPONIBLE, ASIGNADO, EN_USO, DAÑADO, BAJA

    // Proveedor / referencia
    private String proveedor;
    private String referencia;
    private Double precioUnitario;

    private String ubicacion;       // bodega / área
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private String creadoPor;       // usuarioId del JEFE_BODEGA
}
