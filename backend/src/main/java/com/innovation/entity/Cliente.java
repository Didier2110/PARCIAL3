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
@Document(collection = "clientes")
public class Cliente {

	@Id
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
	private String usuarioId;
	private LocalDateTime fechaCreacion;
	private LocalDateTime fechaActualizacion;
	private String contactoPrincipal;
	private String telefonoContacto;
	private String creadoPorUsuarioId;
	private String creadoPorEmail;
	
	@Builder.Default
	private Boolean activo = true;
}
