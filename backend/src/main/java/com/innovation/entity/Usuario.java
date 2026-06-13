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
@Document(collection = "usuarios")
public class Usuario {

	@Id
	private String id;
	
	private String nombre;
	private String apellido;
	private String email;
	private String telefono;
	private String contrasena;
	private String rol;
	private String estado;
	private LocalDateTime fechaCreacion;
	private LocalDateTime fechaActualizacion;
	private String empresa;
	private String documento;
	
	@Builder.Default
	private Boolean activo = true;
}
