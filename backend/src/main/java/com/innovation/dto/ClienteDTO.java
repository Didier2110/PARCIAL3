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
public class ClienteDTO {

	private String id;
	private String razonSocial;
	private String documento;
	private String tipoDocumento;
	private String email;
	private String telefono;
	private String direccion;
	private String ciudad;
	private String departamento;
	private String codigoPostal;
	private String estado;
	private LocalDateTime fechaCreacion;
	private String contactoPrincipal;
	private String telefonoContacto;
	private String creadoPorUsuarioId;
	private String creadoPorEmail;
	private Boolean activo;
}
