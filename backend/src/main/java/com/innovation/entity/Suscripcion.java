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
@Document(collection = "suscripciones")
public class Suscripcion {

	@Id
	private String id;
	
	private String clienteId;
	private String servicioId;
	private String numeroContrato;
	private String estado;
	private LocalDateTime fechaInicio;
	private LocalDateTime fechaFin;
	private Double precioActual;
	private String metodoPago;
	private LocalDateTime proximoVencimiento;
	private Integer diasRestantes;
	private LocalDateTime fechaCreacion;
	private LocalDateTime fechaActualizacion;
	private String observaciones;
	private String creadoPorUsuarioId;
	private String creadoPorEmail;
	
	@Builder.Default
	private Boolean activa = true;
}
