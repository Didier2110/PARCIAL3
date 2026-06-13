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
public class SuscripcionDTO {

	private String id;
	private String clienteId;
	private String servicioId;
	private String nombreServicio;
	private String numeroContrato;
	private String estado;
	private LocalDateTime fechaInicio;
	private LocalDateTime fechaFin;
	private Double precioActual;
	private String metodoPago;
	private LocalDateTime proximoVencimiento;
	private Integer diasRestantes;
	private LocalDateTime fechaCreacion;
	private String observaciones;
	private String creadoPorUsuarioId;
	private String creadoPorEmail;
	private Boolean activa;
}
