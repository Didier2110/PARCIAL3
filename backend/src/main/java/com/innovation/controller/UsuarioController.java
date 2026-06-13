package com.innovation.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.innovation.dto.UsuarioDTO;
import com.innovation.entity.Usuario;
import com.innovation.service.UsuarioService;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

	@Autowired
	private UsuarioService usuarioService;

	@GetMapping("/me")
	public ResponseEntity<?> obtenerUsuarioActual(Authentication authentication) {
		try {
			String email = authentication.getName();
			Usuario usuario = usuarioService.obtenerUsuarioPorEmail(email);
			return ResponseEntity.ok(usuarioService.convertirADTO(usuario));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Map.of("message", e.getMessage()));
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping
	public ResponseEntity<?> crearUsuario(@RequestBody Usuario usuario) {
		try {
			if (usuario.getRol() == null || usuario.getRol().isBlank()) {
				usuario.setRol("CLIENTE");
			}
			Usuario usuarioCreado = usuarioService.crearUsuario(usuario);
			return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.convertirADTO(usuarioCreado));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("message", e.getMessage()));
		}
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<?> obtenerUsuario(@PathVariable String id) {
		try {
			Usuario usuario = usuarioService.obtenerUsuarioById(id);
			return ResponseEntity.ok(usuarioService.convertirADTO(usuario));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Map.of("message", e.getMessage()));
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping
	public ResponseEntity<List<UsuarioDTO>> obtenerTodosLosUsuarios() {
		List<UsuarioDTO> usuarios = usuarioService.obtenerTodosLosUsuarios().stream()
				.map(usuarioService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(usuarios);
	}

	@PreAuthorize("hasAnyRole('ADMIN','JEFE_CUADRILLA')")
	@GetMapping("/tecnicos")
	public ResponseEntity<List<UsuarioDTO>> obtenerTecnicosActivos() {
		List<UsuarioDTO> usuarios = usuarioService.obtenerTodosLosUsuarios().stream()
				.filter(usuario -> Boolean.TRUE.equals(usuario.getActivo()))
				.filter(usuario -> "TECNICO".equalsIgnoreCase(usuario.getRol()))
				.map(usuarioService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(usuarios);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<?> actualizarUsuario(@PathVariable String id, @RequestBody Usuario usuario) {
		try {
			Usuario usuarioActualizado = usuarioService.actualizarUsuario(id, usuario);
			return ResponseEntity.ok(usuarioService.convertirADTO(usuarioActualizado));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("message", e.getMessage()));
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}/rol")
	public ResponseEntity<?> cambiarRol(@PathVariable String id, @RequestBody Map<String, String> body) {
		try {
			String nuevoRol = body.get("rol");
			if (nuevoRol == null || nuevoRol.isBlank()) {
				return ResponseEntity.badRequest().body(Map.of("message", "El rol no puede estar vacio"));
			}
			Usuario usuario = usuarioService.cambiarRol(id, nuevoRol);
			return ResponseEntity.ok(usuarioService.convertirADTO(usuario));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("message", e.getMessage()));
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}/contrasena")
	public ResponseEntity<?> cambiarContrasena(@PathVariable String id, @RequestBody Map<String, String> body) {
		try {
			String nuevaContrasena = body.get("contrasena");
			if (nuevaContrasena == null || nuevaContrasena.isBlank()) {
				return ResponseEntity.badRequest().body(Map.of("message", "La contrasena no puede estar vacia"));
			}
			usuarioService.cambiarContrasena(id, nuevaContrasena);
			return ResponseEntity.ok(Map.of("message", "Contrasena actualizada exitosamente"));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("message", e.getMessage()));
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}/desactivar")
	public ResponseEntity<?> desactivarUsuario(@PathVariable String id) {
		try {
			usuarioService.desactivarUsuario(id);
			return ResponseEntity.ok(Map.of("message", "Usuario desactivado exitosamente"));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Map.of("message", e.getMessage()));
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}/activar")
	public ResponseEntity<?> activarUsuario(@PathVariable String id) {
		try {
			usuarioService.activarUsuario(id);
			return ResponseEntity.ok(Map.of("message", "Usuario activado exitosamente"));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Map.of("message", e.getMessage()));
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id}")
	public ResponseEntity<?> eliminarUsuario(@PathVariable String id) {
		try {
			usuarioService.eliminarUsuario(id);
			return ResponseEntity.ok(Map.of("message", "Usuario eliminado exitosamente"));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Map.of("message", e.getMessage()));
		}
	}
}
