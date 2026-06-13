package com.innovation.controller;

import java.time.YearMonth;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.innovation.dto.FacturaDTO;
import com.innovation.entity.Cliente;
import com.innovation.entity.Factura;
import com.innovation.entity.Usuario;
import com.innovation.service.ClienteService;
import com.innovation.service.FacturaService;
import com.innovation.service.PdfDocumentService;
import com.innovation.service.UsuarioService;

@RestController
@RequestMapping("/api/v1/facturas")
public class FacturaController {

	@Autowired
	private FacturaService facturaService;

	@Autowired
	private UsuarioService usuarioService;

	@Autowired
	private ClienteService clienteService;

	@Autowired
	private PdfDocumentService pdfDocumentService;

	@PreAuthorize("hasAnyRole('ADMIN','CONTABLE')")
	@PostMapping
	public ResponseEntity<?> crearFactura(@RequestBody Factura factura) {
		try {
			Factura facturaCreada = facturaService.crearFactura(factura);
			return ResponseEntity.status(HttpStatus.CREATED).body(facturaService.convertirADTO(facturaCreada));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','CONTABLE')")
	@PostMapping("/generar-mensuales")
	public ResponseEntity<List<FacturaDTO>> generarFacturasMensuales(@RequestParam(required = false) String periodo) {
		YearMonth periodoFacturado = (periodo == null || periodo.isBlank()) ? YearMonth.now() : YearMonth.parse(periodo);
		List<FacturaDTO> facturas = facturaService.generarFacturasMensuales(periodoFacturado).stream()
				.map(facturaService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(facturas);
	}

	@PreAuthorize("hasAnyRole('ADMIN','CONTABLE')")
	@GetMapping("/{id}")
	public ResponseEntity<?> obtenerFactura(@PathVariable String id) {
		try {
			Factura factura = facturaService.obtenerFacturaById(id);
			return ResponseEntity.ok(facturaService.convertirADTO(factura));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','CONTABLE')")
	@GetMapping
	public ResponseEntity<List<FacturaDTO>> obtenerTodasLasFacturas() {
		List<FacturaDTO> facturas = facturaService.obtenerTodasLasFacturas().stream()
				.map(facturaService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(facturas);
	}

	@PreAuthorize("hasAnyRole('ADMIN','CONTABLE')")
	@GetMapping("/suscripcion/{suscripcionId}")
	public ResponseEntity<List<FacturaDTO>> obtenerFacturasPorSuscripcion(@PathVariable String suscripcionId) {
		List<FacturaDTO> facturas = facturaService.obtenerFacturasPorSuscripcion(suscripcionId).stream()
				.map(facturaService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(facturas);
	}

	@PreAuthorize("hasAnyRole('ADMIN','CONTABLE')")
	@GetMapping("/pendientes/todas")
	public ResponseEntity<List<FacturaDTO>> obtenerFacturasPendientes() {
		List<FacturaDTO> facturas = facturaService.obtenerFacturasPendientes().stream()
				.map(facturaService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(facturas);
	}

	@PreAuthorize("hasRole('CLIENTE')")
	@GetMapping("/mi-estado")
	public ResponseEntity<Map<String, Object>> obtenerMiEstadoFacturacion(Authentication authentication) {
		String email = authentication.getName();
		String usuarioId = usuarioService.obtenerUsuarioPorEmail(email).getId();
		return ResponseEntity.ok(facturaService.obtenerResumenFacturacionPorUsuario(usuarioId));
	}

	@PreAuthorize("hasAnyRole('ADMIN','CONTABLE')")
	@GetMapping("/{id}/pdf")
	public ResponseEntity<byte[]> descargarFacturaPdf(@PathVariable String id) {
		Factura factura = facturaService.obtenerFacturaById(id);
		byte[] pdf = pdfDocumentService.generarFacturaPdf(id);
		String nombre = (factura.getNumeroFactura() == null ? "factura" : factura.getNumeroFactura()) + ".pdf";
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombre + "\"")
				.contentType(MediaType.APPLICATION_PDF)
				.body(pdf);
	}

	@PreAuthorize("hasAnyRole('ADMIN','CONTABLE','VENDEDOR','PUNTO_VENTA','SOPORTE','ADMINISTRATIVO')")
	@GetMapping("/estado-cliente/{clienteId}")
	public ResponseEntity<?> obtenerEstadoCarteraCliente(@PathVariable String clienteId, Authentication authentication) {
		Usuario usuario = usuarioService.obtenerUsuarioPorEmail(authentication.getName());
		if (esComercial(usuario) && !clientePerteneceAlUsuario(clienteId, usuario)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body(Map.of("message", "No tienes permiso para consultar cartera de este cliente"));
		}
		return ResponseEntity.ok(facturaService.obtenerEstadoCarteraPorCliente(clienteId));
	}

	@PreAuthorize("hasAnyRole('ADMIN','CONTABLE')")
	@PostMapping("/{id}/marcar-pagada")
	public ResponseEntity<?> marcarComoPagada(@PathVariable String id,
			@RequestBody java.util.Map<String, String> request) {
		try {
			String comprobante = request.get("comprobante");
			Factura factura = facturaService.marcarComoPagada(id, comprobante);
			return ResponseEntity.ok(facturaService.convertirADTO(factura));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','CONTABLE')")
	@PostMapping(value = "/{id}/registrar-pago", consumes = "multipart/form-data")
	public ResponseEntity<?> registrarPago(@PathVariable String id,
			@RequestParam String metodoPago,
			@RequestParam(required = false) String referenciaPago,
			@RequestParam MultipartFile comprobante,
			Authentication authentication) {
		try {
			Factura factura = facturaService.registrarPago(id, metodoPago, referenciaPago, comprobante,
					authentication.getName());
			return ResponseEntity.ok(facturaService.convertirADTO(factura));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
		}
	}

	private boolean esComercial(Usuario usuario) {
		return "VENDEDOR".equals(usuario.getRol()) || "PUNTO_VENTA".equals(usuario.getRol());
	}

	private boolean clientePerteneceAlUsuario(String clienteId, Usuario usuario) {
		try {
			Cliente cliente = clienteService.obtenerClienteById(clienteId);
			return usuario.getId().equals(cliente.getCreadoPorUsuarioId());
		} catch (Exception e) {
			return false;
		}
	}
}
