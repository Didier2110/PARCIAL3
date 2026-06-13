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
@Document(collection = "servicios")
public class Servicio {

	@Id
	private String id;
	
	private String nombre;
	private String descripcion;
	private String tipo;
	private Double precioMensual;
	private String velocidad;
	private Integer limiteAncho;
	private String estado;
	private LocalDateTime fechaCreacion;
	private LocalDateTime fechaActualizacion;
	private List<String> caracteristicas;
	
	@Builder.Default
	private Boolean activo = true;
}
