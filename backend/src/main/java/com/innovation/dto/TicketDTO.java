package com.innovation.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketDTO {

	private String id;
	private String clienteId;
	private String asunto;
	private String descripcion;
	private String categoria;
	private String prioridad;
	private String estado;
	private String usuarioAsignadoId;
	private LocalDateTime fechaCreacion;
	private LocalDateTime fechaActualizacion;
	private LocalDateTime fechaResolucion;
	private String solucion;
	private Integer tiempoResolucionMinutos;
	private Boolean abierto;
}
