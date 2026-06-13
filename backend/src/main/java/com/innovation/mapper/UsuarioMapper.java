package com.innovation.mapper;

import com.innovation.dto.UsuarioDTO;
import com.innovation.entity.Usuario;

public class UsuarioMapper {

	public static UsuarioDTO toDTO(Usuario usuario) {
		if (usuario == null) {
			return null;
		}
		return UsuarioDTO.builder()
				.id(usuario.getId())
				.nombre(usuario.getNombre())
				.apellido(usuario.getApellido())
				.email(usuario.getEmail())
				.telefono(usuario.getTelefono())
				.rol(usuario.getRol())
				.estado(usuario.getEstado())
				.fechaCreacion(usuario.getFechaCreacion())
				.empresa(usuario.getEmpresa())
				.documento(usuario.getDocumento())
				.activo(usuario.getActivo())
				.build();
	}

	public static Usuario toEntity(UsuarioDTO dto) {
		if (dto == null) {
			return null;
		}
		return Usuario.builder()
				.id(dto.getId())
				.nombre(dto.getNombre())
				.apellido(dto.getApellido())
				.email(dto.getEmail())
				.telefono(dto.getTelefono())
				.rol(dto.getRol())
				.estado(dto.getEstado())
				.empresa(dto.getEmpresa())
				.documento(dto.getDocumento())
				.activo(dto.getActivo())
				.build();
	}
}
