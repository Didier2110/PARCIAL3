package com.innovation.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.innovation.dto.UsuarioDTO;
import com.innovation.entity.Usuario;
import com.innovation.exception.ResourceNotFoundException;
import com.innovation.repository.UsuarioRepository;

@Service
public class UsuarioService {

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	public Usuario crearUsuario(Usuario usuario) {
		if (usuarioRepository.existsByEmail(usuario.getEmail())) {
			throw new RuntimeException("El email ya está registrado");
		}
		usuario.setContrasena(passwordEncoder.encode(usuario.getContrasena()));
		usuario.setFechaCreacion(LocalDateTime.now());
		usuario.setEstado("ACTIVO");
		usuario.setActivo(true);
		return usuarioRepository.save(usuario);
	}

	public Usuario obtenerUsuarioById(String id) {
		Optional<Usuario> usuario = usuarioRepository.findById(id);
		if (!usuario.isPresent()) {
			throw new ResourceNotFoundException("Usuario no encontrado con id: " + id);
		}
		return usuario.get();
	}

	public Usuario obtenerUsuarioPorEmail(String email) {
		Usuario usuario = usuarioRepository.findByEmail(email);
		if (usuario == null) {
			throw new ResourceNotFoundException("Usuario no encontrado con email: " + email);
		}
		return usuario;
	}

	public Usuario actualizarUsuario(String id, Usuario usuarioActualizado) {
		Usuario usuario = obtenerUsuarioById(id);
		usuario.setNombre(usuarioActualizado.getNombre());
		usuario.setApellido(usuarioActualizado.getApellido());
		usuario.setTelefono(usuarioActualizado.getTelefono());
		usuario.setEmpresa(usuarioActualizado.getEmpresa());
		usuario.setFechaActualizacion(LocalDateTime.now());
		return usuarioRepository.save(usuario);
	}

	public void desactivarUsuario(String id) {
		Usuario usuario = obtenerUsuarioById(id);
		usuario.setActivo(false);
		usuario.setEstado("INACTIVO");
		usuario.setFechaActualizacion(LocalDateTime.now());
		usuarioRepository.save(usuario);
	}

	public void activarUsuario(String id) {
		Usuario usuario = obtenerUsuarioById(id);
		usuario.setActivo(true);
		usuario.setEstado("ACTIVO");
		usuario.setFechaActualizacion(LocalDateTime.now());
		usuarioRepository.save(usuario);
	}

	public void eliminarUsuario(String id) {
		obtenerUsuarioById(id); // valida que exista
		usuarioRepository.deleteById(id);
	}

	public Usuario cambiarRol(String id, String nuevoRol) {
		Usuario usuario = obtenerUsuarioById(id);
		usuario.setRol(nuevoRol.toUpperCase());
		usuario.setFechaActualizacion(LocalDateTime.now());
		return usuarioRepository.save(usuario);
	}

	public Usuario cambiarContrasena(String id, String nuevaContrasena) {
		if (nuevaContrasena == null || nuevaContrasena.length() < 6) {
			throw new IllegalArgumentException("La contrasena debe tener minimo 6 caracteres");
		}
		Usuario usuario = obtenerUsuarioById(id);
		usuario.setContrasena(passwordEncoder.encode(nuevaContrasena));
		usuario.setFechaActualizacion(LocalDateTime.now());
		return usuarioRepository.save(usuario);
	}

	public java.util.List<Usuario> obtenerTodosLosUsuarios() {
		return usuarioRepository.findAll();
	}

	public UsuarioDTO convertirADTO(Usuario usuario) {
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
}
