package com.innovation.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.innovation.dto.AuthResponseDTO;
import com.innovation.dto.LoginDTO;
import com.innovation.entity.Usuario;
import com.innovation.jwt.JwtTokenProvider;
import com.innovation.security.CustomUserDetails;
import com.innovation.service.UsuarioService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private JwtTokenProvider tokenProvider;

	@Autowired
	private UsuarioService usuarioService;

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginDTO loginDTO) {
		try {
			Authentication authentication = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(
							loginDTO.getEmail(),
							loginDTO.getContrasena()));

			CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
			Usuario usuario = userDetails.getUsuario();

			String token = tokenProvider.generateToken(usuario.getEmail());

			return ResponseEntity.ok(AuthResponseDTO.builder()
					.id(usuario.getId())
					.token(token)
					.tipo("Bearer")
					.email(usuario.getEmail())
					.nombre(usuario.getNombre() + " " + usuario.getApellido())
					.rol(usuario.getRol())
					.expiresIn(86400L)
					.build());

		} catch (AuthenticationException e) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(java.util.Map.of("message", "Email o contraseña inválidos"));
		}
	}

	@PostMapping("/registro")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<?> registro(@RequestBody Usuario usuario) {
		try {
			if (usuario.getRol() == null || usuario.getRol().isBlank()) {
				usuario.setRol("CLIENTE");
			}
			Usuario usuarioCreado = usuarioService.crearUsuario(usuario);
			return ResponseEntity.status(HttpStatus.CREATED)
					.body(usuarioService.convertirADTO(usuarioCreado));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(java.util.Map.of("message", "Error en el registro: " + e.getMessage()));
		}
	}
}
