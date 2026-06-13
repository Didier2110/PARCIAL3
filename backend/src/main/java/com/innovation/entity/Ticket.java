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
@Document(collection = "tickets")
public class Ticket {

	@Id
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
	
	@Builder.Default
	private Boolean abierto = true;
}
