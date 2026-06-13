package com.innovation.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicioDTO {

	private String id;
	private String nombre;
	private String descripcion;
	private String tipo;
	private Double precioMensual;
	private String velocidad;
	private Integer limiteAncho;
	private String estado;
	private LocalDateTime fechaCreacion;
	private List<String> caracteristicas;
	private Boolean activo;
}
