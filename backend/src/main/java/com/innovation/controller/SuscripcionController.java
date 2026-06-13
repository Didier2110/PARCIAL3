package com.innovation.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import com.innovation.dto.SuscripcionDTO;
import com.innovation.entity.Suscripcion;
import com.innovation.entity.Usuario;
import com.innovation.service.PdfDocumentService;
import com.innovation.service.SuscripcionService;
import com.innovation.service.UsuarioService;

@RestController
@RequestMapping("/api/v1/suscripciones")
public class SuscripcionController {

	@Autowired
	private SuscripcionService suscripcionService;

	@Autowired
	private UsuarioService usuarioService;

	@Autowired
	private PdfDocumentService pdfDocumentService;

	@PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','PUNTO_VENTA')")
	@PostMapping
	public ResponseEntity<?> crearSuscripcion(@RequestBody Suscripcion suscripcion, Authentication authentication) {
		try {
			Usuario usuario = usuarioService.obtenerUsuarioPorEmail(authentication.getName());
			suscripcion.setCreadoPorUsuarioId(usuario.getId());
			suscripcion.setCreadoPorEmail(usuario.getEmail());
			Suscripcion suscripcionCreada = suscripcionService.crearSuscripcion(suscripcion);
			return ResponseEntity.status(HttpStatus.CREATED)
					.body(suscripcionService.convertirADTO(suscripcionCreada));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','VENDEDOR','PUNTO_VENTA','CONTABLE','ADMINISTRATIVO')")
	@GetMapping("/{id}")
	public ResponseEntity<?> obtenerSuscripcion(@PathVariable String id, Authentication authentication) {
		try {
			Suscripcion suscripcion = suscripcionService.obtenerSuscripcionById(id);
			Usuario usuario = usuarioService.obtenerUsuarioPorEmail(authentication.getName());
			if (esComercial(usuario) && !usuario.getId().equals(suscripcion.getCreadoPorUsuarioId())) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN)
						.body("Error: No tienes permiso para ver esta suscripcion");
			}
			return ResponseEntity.ok(suscripcionService.convertirADTO(suscripcion));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','VENDEDOR','PUNTO_VENTA','CONTABLE','ADMINISTRATIVO')")
	@GetMapping("/{id}/contrato-pdf")
	public ResponseEntity<?> descargarContratoPdf(@PathVariable String id) {
		try {
			Suscripcion suscripcion = suscripcionService.obtenerSuscripcionById(id);
			byte[] pdf = pdfDocumentService.generarContratoPdf(id);
			String nombre = (suscripcion.getNumeroContrato() == null ? "contrato" : suscripcion.getNumeroContrato()) + ".pdf";
			return ResponseEntity.ok()
					.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombre + "\"")
					.contentType(MediaType.APPLICATION_PDF)
					.body(pdf);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','VENDEDOR','PUNTO_VENTA','CONTABLE','ADMINISTRATIVO')")
	@GetMapping
	public ResponseEntity<List<SuscripcionDTO>> obtenerTodasLasSuscripciones(Authentication authentication) {
		List<Suscripcion> visibles = suscripcionesVisibles(authentication, false);
		List<SuscripcionDTO> suscripciones = visibles.stream()
				.map(suscripcionService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(suscripciones);
	}

	@PreAuthorize("hasRole('CLIENTE')")
	@GetMapping("/mias")
	public ResponseEntity<List<SuscripcionDTO>> obtenerMisSuscripciones(Authentication authentication) {
		String email = authentication.getName();
		String usuarioId = usuarioService.obtenerUsuarioPorEmail(email).getId();
		List<SuscripcionDTO> suscripciones = suscripcionService.obtenerSuscripcionesPorUsuario(usuarioId).stream()
				.map(suscripcionService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(suscripciones);
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','VENDEDOR','PUNTO_VENTA','CONTABLE','ADMINISTRATIVO')")
	@GetMapping("/cliente/{clienteId}")
	public ResponseEntity<List<SuscripcionDTO>> obtenerSuscripcionesPorCliente(@PathVariable String clienteId,
			Authentication authentication) {
		Usuario usuario = usuarioService.obtenerUsuarioPorEmail(authentication.getName());
		List<Suscripcion> suscripciones = suscripcionService.obtenerSuscripcionesPorCliente(clienteId);
		if (esComercial(usuario)) {
			suscripciones = suscripciones.stream()
					.filter(s -> usuario.getId().equals(s.getCreadoPorUsuarioId()))
					.collect(Collectors.toList());
		}
		List<SuscripcionDTO> dto = suscripciones.stream()
				.map(suscripcionService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(dto);
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','VENDEDOR','PUNTO_VENTA','CONTABLE','ADMINISTRATIVO')")
	@GetMapping("/activas/todas")
	public ResponseEntity<List<SuscripcionDTO>> obtenerSuscripcionesActivas(Authentication authentication) {
		List<Suscripcion> visibles = suscripcionesVisibles(authentication, true);
		List<SuscripcionDTO> suscripciones = visibles.stream()
				.map(suscripcionService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(suscripciones);
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE')")
	@PutMapping("/{id}")
	public ResponseEntity<?> actualizarSuscripcion(@PathVariable String id, @RequestBody Suscripcion suscripcion) {
		try {
			Suscripcion suscripcionActualizada = suscripcionService.actualizarSuscripcion(id, suscripcion);
			return ResponseEntity.ok(suscripcionService.convertirADTO(suscripcionActualizada));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE')")
	@DeleteMapping("/{id}")
	public ResponseEntity<?> cancelarSuscripcion(@PathVariable String id) {
		try {
			suscripcionService.cancelarSuscripcion(id);
			return ResponseEntity.ok("Suscripción cancelada exitosamente");
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasRole('CLIENTE')")
	@PostMapping("/solicitar")
	public ResponseEntity<?> solicitarServicio(Authentication authentication,
			@RequestBody Map<String, Object> request) {
		try {
			String email = authentication.getName();
			String usuarioId = usuarioService.obtenerUsuarioPorEmail(email).getId();

			String servicioId = request.get("servicioId") != null ? request.get("servicioId").toString() : null;
			if (servicioId == null || servicioId.isBlank()) {
				return ResponseEntity.badRequest().body(Map.of("message", "Debe seleccionar un plan de internet"));
			}

			String metodoPago = request.get("metodoPago") != null ? request.get("metodoPago").toString() : "TRANSFERENCIA";
			String observaciones = request.get("observaciones") != null ? request.get("observaciones").toString() : "";

			Map<String, Object> resultado = suscripcionService.solicitarServicioCliente(
					usuarioId,
					servicioId,
					metodoPago,
					observaciones,
					null);

			return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
		}
	}

	private List<Suscripcion> suscripcionesVisibles(Authentication authentication, boolean soloActivas) {
		Usuario usuario = usuarioService.obtenerUsuarioPorEmail(authentication.getName());
		if (esComercial(usuario)) {
			return soloActivas
					? suscripcionService.obtenerSuscripcionesActivasPorCreador(usuario.getId())
					: suscripcionService.obtenerSuscripcionesPorCreador(usuario.getId());
		}
		return soloActivas
				? suscripcionService.obtenerSuscripcionesActivas()
				: suscripcionService.obtenerTodasLasSuscripciones();
	}

	private boolean esComercial(Usuario usuario) {
		return "VENDEDOR".equals(usuario.getRol()) || "PUNTO_VENTA".equals(usuario.getRol());
	}
}
