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
public class UsuarioDTO {

	private String id;
	private String nombre;
	private String apellido;
	private String email;
	private String telefono;
	private String rol;
	private String estado;
	private LocalDateTime fechaCreacion;
	private String empresa;
	private String documento;
	private Boolean activo;
}
