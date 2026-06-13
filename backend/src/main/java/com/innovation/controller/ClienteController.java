package com.innovation.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.innovation.dto.ClienteDTO;
import com.innovation.entity.Cliente;
import com.innovation.entity.Usuario;
import com.innovation.service.ClienteService;
import com.innovation.service.UsuarioService;

@RestController
@RequestMapping("/api/v1/clientes")
public class ClienteController {

	@Autowired
	private ClienteService clienteService;

	@Autowired
	private UsuarioService usuarioService;

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','ADMINISTRATIVO','VENDEDOR','PUNTO_VENTA')")
	@PostMapping
	public ResponseEntity<?> crearCliente(@RequestBody Cliente cliente, Authentication authentication) {
		try {
			Usuario usuario = usuarioService.obtenerUsuarioPorEmail(authentication.getName());
			cliente.setCreadoPorUsuarioId(usuario.getId());
			cliente.setCreadoPorEmail(usuario.getEmail());
			Cliente clienteCreado = clienteService.crearCliente(cliente);
			return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.convertirADTO(clienteCreado));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','PUNTO_VENTA','ADMINISTRATIVO','CONTABLE','SOPORTE','CLIENTE')")
	@GetMapping("/{id}")
	public ResponseEntity<?> obtenerCliente(@PathVariable String id, Authentication authentication) {
		try {
			Cliente cliente = clienteService.obtenerClienteById(id);
			Usuario usuario = usuarioService.obtenerUsuarioPorEmail(authentication.getName());
			if (esComercial(usuario) && !usuario.getId().equals(cliente.getCreadoPorUsuarioId())) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: No tienes permiso para ver este cliente");
			}
			return ResponseEntity.ok(clienteService.convertirADTO(cliente));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','PUNTO_VENTA','ADMINISTRATIVO','CONTABLE','SOPORTE')")
	@GetMapping
	public ResponseEntity<List<ClienteDTO>> obtenerTodosLosClientes(Authentication authentication) {
		List<Cliente> clientes = clientesVisibles(authentication, false);
		List<ClienteDTO> dto = clientes.stream()
				.map(clienteService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(dto);
	}

	@PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','PUNTO_VENTA','ADMINISTRATIVO','CONTABLE','SOPORTE')")
	@GetMapping("/activos/todos")
	public ResponseEntity<List<ClienteDTO>> obtenerClientesActivos(Authentication authentication) {
		List<Cliente> clientes = clientesVisibles(authentication, true);
		List<ClienteDTO> dto = clientes.stream()
				.map(clienteService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(dto);
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','ADMINISTRATIVO','CLIENTE')")
	@GetMapping("/usuario/{usuarioId}")
	public ResponseEntity<List<ClienteDTO>> obtenerClientesPorUsuario(@PathVariable String usuarioId) {
		List<ClienteDTO> clientes = clienteService.obtenerClientesPorUsuario(usuarioId).stream()
				.map(clienteService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(clientes);
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE')")
	@PutMapping("/{id}")
	public ResponseEntity<?> actualizarCliente(@PathVariable String id, @RequestBody Cliente cliente) {
		try {
			Cliente clienteActualizado = clienteService.actualizarCliente(id, cliente);
			return ResponseEntity.ok(clienteService.convertirADTO(clienteActualizado));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE')")
	@DeleteMapping("/{id}")
	public ResponseEntity<?> eliminarCliente(@PathVariable String id) {
		try {
			clienteService.eliminarCliente(id);
			return ResponseEntity.ok("Cliente eliminado exitosamente");
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
		}
	}

	private List<Cliente> clientesVisibles(Authentication authentication, boolean soloActivos) {
		Usuario usuario = usuarioService.obtenerUsuarioPorEmail(authentication.getName());
		if (esComercial(usuario)) {
			return soloActivos
					? clienteService.obtenerClientesActivosPorCreador(usuario.getId())
					: clienteService.obtenerClientesPorCreador(usuario.getId());
		}
		return soloActivos ? clienteService.obtenerClientesActivos() : clienteService.obtenerTodosLosClientes();
	}

	private boolean esComercial(Usuario usuario) {
		return "VENDEDOR".equals(usuario.getRol()) || "PUNTO_VENTA".equals(usuario.getRol());
	}
}
