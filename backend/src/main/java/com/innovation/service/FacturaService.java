package com.innovation.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.innovation.dto.FacturaDTO;
import com.innovation.entity.Cliente;
import com.innovation.entity.Factura;
import com.innovation.entity.Servicio;
import com.innovation.entity.Suscripcion;
import com.innovation.entity.Usuario;
import com.innovation.exception.ResourceNotFoundException;
import com.innovation.repository.ClienteRepository;
import com.innovation.repository.FacturaRepository;
import com.innovation.repository.ServicioRepository;
import com.innovation.repository.SuscripcionRepository;
import com.innovation.repository.UsuarioRepository;

@Service
public class FacturaService {

	@Autowired
	private FacturaRepository facturaRepository;

	@Autowired
	private ClienteRepository clienteRepository;

	@Autowired
	private SuscripcionRepository suscripcionRepository;

	@Autowired
	private ServicioRepository servicioRepository;

	@Autowired
	private UsuarioRepository usuarioRepository;

	public Factura crearFactura(Factura factura) {
		LocalDateTime ahora = LocalDateTime.now();
		if (factura.getFechaEmision() == null) {
			factura.setFechaEmision(ahora);
		}
		if (factura.getFechaVencimiento() == null) {
			factura.setFechaVencimiento(ahora.plusDays(5));
		}
		if (factura.getEstado() == null || factura.getEstado().isBlank()) {
			factura.setEstado("PENDIENTE");
		}
		factura.setFechaCreacion(ahora);
		factura.setPagada(false);
		return facturaRepository.save(factura);
	}

	public List<Factura> generarFacturasMensuales(YearMonth periodo) {
		List<Suscripcion> activas = suscripcionRepository.findByActiva(true);
		LocalDateTime inicio = periodo.atDay(1).atStartOfDay();
		LocalDateTime fin = periodo.atEndOfMonth().atTime(23, 59, 59);
		String periodoTexto = periodo.toString();

		return activas.stream()
				.map(suscripcion -> generarFacturaMensualSiNoExiste(suscripcion, periodoTexto, inicio, fin))
				.collect(Collectors.toList());
	}

	private Factura generarFacturaMensualSiNoExiste(Suscripcion suscripcion, String periodoTexto,
			LocalDateTime inicio, LocalDateTime fin) {
		Factura existente = facturaRepository.findBySuscripcionIdAndPeriodoFacturado(suscripcion.getId(), periodoTexto);
		if (existente != null) {
			return existente;
		}

		double valor = suscripcion.getPrecioActual() != null ? suscripcion.getPrecioActual() : 0.0;
		String numero = "FAC-" + periodoTexto.replace("-", "") + "-"
				+ suscripcion.getId().substring(0, Math.min(6, suscripcion.getId().length())).toUpperCase();

		Factura factura = Factura.builder()
				.suscripcionId(suscripcion.getId())
				.numeroFactura(numero)
				.estado("PENDIENTE")
				.periodoFacturado(periodoTexto)
				.fechaEmision(LocalDateTime.now())
				.fechaVencimiento(inicio.plusDays(5))
				.fechaInicioPeriodo(inicio)
				.fechaFinPeriodo(fin)
				.subtotal(valor)
				.impuestos(0.0)
				.total(valor)
				.metodoPago(suscripcion.getMetodoPago())
				.fechaCreacion(LocalDateTime.now())
				.pagada(false)
				.build();
		return facturaRepository.save(factura);
	}

	public Factura obtenerFacturaById(String id) {
		Optional<Factura> factura = facturaRepository.findById(id);
		if (factura.isEmpty()) {
			throw new ResourceNotFoundException("Factura no encontrada con id: " + id);
		}
		return factura.get();
	}

	public Factura obtenerFacturaPorNumero(String numeroFactura) {
		Factura factura = facturaRepository.findByNumeroFactura(numeroFactura);
		if (factura == null) {
			throw new ResourceNotFoundException("Factura no encontrada con numero: " + numeroFactura);
		}
		return factura;
	}

	public List<Factura> obtenerFacturasPorSuscripcion(String suscripcionId) {
		return facturaRepository.findBySuscripcionId(suscripcionId);
	}

	public List<Factura> obtenerFacturasPorEstado(String estado) {
		return facturaRepository.findByEstado(estado);
	}

	public Factura marcarComoPagada(String id, String comprobante) {
		Factura factura = obtenerFacturaById(id);
		LocalDateTime ahora = LocalDateTime.now();
		factura.setPagada(true);
		factura.setEstado("PAGADA");
		factura.setFechaPago(ahora);
		factura.setComprobantePago(comprobante);
		factura.setFechaActualizacion(ahora);
		return facturaRepository.save(factura);
	}

	public Factura registrarPago(String id, String metodoPago, String referenciaPago,
			MultipartFile comprobante, String emailUsuario) {
		Factura factura = obtenerFacturaById(id);
		String metodo = metodoPago == null ? "" : metodoPago.trim().toUpperCase();
		if (!metodo.equals("EFECTIVO") && !metodo.equals("TRANSFERENCIA")) {
			throw new IllegalArgumentException("El metodo de pago debe ser EFECTIVO o TRANSFERENCIA");
		}
		if (comprobante == null || comprobante.isEmpty()) {
			throw new IllegalArgumentException("Debes subir el comprobante de pago");
		}

		Usuario usuario = usuarioRepository.findByEmail(emailUsuario);
		if (usuario == null) {
			throw new ResourceNotFoundException("Usuario no encontrado");
		}
		LocalDateTime ahora = LocalDateTime.now();
		String nombreOriginal = limpiarNombreArchivo(comprobante.getOriginalFilename());
		String nombreArchivo = factura.getId() + "-" + System.currentTimeMillis() + "-" + nombreOriginal;
		Path carpeta = Path.of("uploads", "comprobantes");
		Path destino = carpeta.resolve(nombreArchivo);

		try {
			Files.createDirectories(carpeta);
			Files.copy(comprobante.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
		} catch (IOException e) {
			throw new RuntimeException("No se pudo guardar el comprobante", e);
		}

		factura.setPagada(true);
		factura.setEstado("PAGADA");
		factura.setMetodoPago(metodo);
		factura.setFechaPago(ahora);
		factura.setComprobantePago(nombreArchivo);
		factura.setComprobanteNombreArchivo(nombreOriginal);
		factura.setComprobanteTipoContenido(comprobante.getContentType());
		factura.setComprobanteRuta(destino.toString());
		factura.setReferenciaPago(referenciaPago);
		factura.setPagoRegistradoPorId(usuario.getId());
		factura.setPagoRegistradoPorNombre((usuario.getNombre() + " " + usuario.getApellido()).trim());
		factura.setPagoRegistradoPorEmail(usuario.getEmail());
		factura.setFechaRegistroComprobante(ahora);
		factura.setFechaActualizacion(ahora);
		return facturaRepository.save(factura);
	}

	public List<Factura> obtenerTodasLasFacturas() {
		return facturaRepository.findAll();
	}

	public List<Factura> obtenerFacturasPendientes() {
		return facturaRepository.findByPagada(false);
	}

	public Map<String, Object> obtenerResumenFacturacionPorUsuario(String usuarioId) {
		List<Cliente> clientes = clienteRepository.findByUsuarioId(usuarioId);
		if (clientes.isEmpty()) {
			return Map.of(
					"estado", "SIN_CLIENTE_ASOCIADO",
					"cliente", "Sin cliente asociado",
					"suscripcionesActivas", 0,
					"facturasPendientes", 0,
					"totalPendiente", 0.0,
					"proximoVencimiento", "-");
		}

		Cliente cliente = clientes.get(0);
		List<Suscripcion> suscripciones = suscripcionRepository.findByClienteId(cliente.getId());
		List<String> suscripcionIds = suscripciones.stream()
				.map(Suscripcion::getId)
				.collect(Collectors.toList());

		List<Factura> facturas = suscripcionIds.stream()
				.flatMap(suscripcionId -> facturaRepository.findBySuscripcionId(suscripcionId).stream())
				.collect(Collectors.toList());

		List<Factura> pendientes = facturas.stream()
				.filter(factura -> !Boolean.TRUE.equals(factura.getPagada()))
				.collect(Collectors.toList());

		double totalPendiente = pendientes.stream()
				.map(Factura::getTotal)
				.filter(total -> total != null)
				.mapToDouble(Double::doubleValue)
				.sum();

		String proximoVencimiento = pendientes.stream()
				.map(Factura::getFechaVencimiento)
				.filter(fecha -> fecha != null)
				.min(Comparator.naturalOrder())
				.map(LocalDateTime::toString)
				.orElse("-");

		return Map.of(
				"estado", pendientes.isEmpty() ? "AL_DIA" : "CON_DEUDA",
				"cliente", cliente.getRazonSocial(),
				"suscripcionesActivas", suscripciones.stream().filter(Suscripcion::getActiva).count(),
				"facturasPendientes", pendientes.size(),
				"totalPendiente", totalPendiente,
				"proximoVencimiento", proximoVencimiento);
	}

	public Map<String, Object> obtenerEstadoCarteraPorCliente(String clienteId) {
		Cliente cliente = clienteRepository.findById(clienteId)
				.orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
		List<Suscripcion> suscripciones = suscripcionRepository.findByClienteId(cliente.getId());
		List<Factura> facturas = suscripciones.stream()
				.map(Suscripcion::getId)
				.flatMap(suscripcionId -> facturaRepository.findBySuscripcionId(suscripcionId).stream())
				.collect(Collectors.toList());

		long pendientes = facturas.stream()
				.filter(factura -> !Boolean.TRUE.equals(factura.getPagada()))
				.count();

		return Map.of(
				"clienteId", cliente.getId(),
				"estado", pendientes > 0 ? "DEBE" : "PAZ_Y_SALVO",
				"label", pendientes > 0 ? "Debe dinero" : "Paz y salvo");
	}

	public FacturaDTO convertirADTO(Factura factura) {
		String clienteNombre = null;
		String servicioNombre = null;
		if (factura.getSuscripcionId() != null) {
			Optional<Suscripcion> suscripcion = suscripcionRepository.findById(factura.getSuscripcionId());
			if (suscripcion.isPresent()) {
				clienteNombre = clienteRepository.findById(suscripcion.get().getClienteId())
						.map(Cliente::getRazonSocial)
						.orElse(null);
				servicioNombre = servicioRepository.findById(suscripcion.get().getServicioId())
						.map(Servicio::getNombre)
						.orElse(null);
			}
		}

		return FacturaDTO.builder()
				.id(factura.getId())
				.suscripcionId(factura.getSuscripcionId())
				.clienteNombre(clienteNombre)
				.servicioNombre(servicioNombre)
				.numeroFactura(factura.getNumeroFactura())
				.estado(factura.getEstado())
				.periodoFacturado(factura.getPeriodoFacturado())
				.fechaEmision(factura.getFechaEmision())
				.fechaVencimiento(factura.getFechaVencimiento())
				.fechaInicioPeriodo(factura.getFechaInicioPeriodo())
				.fechaFinPeriodo(factura.getFechaFinPeriodo())
				.subtotal(factura.getSubtotal())
				.impuestos(factura.getImpuestos())
				.total(factura.getTotal())
				.metodoPago(factura.getMetodoPago())
				.fechaPago(factura.getFechaPago())
				.comprobantePago(factura.getComprobantePago())
				.comprobanteNombreArchivo(factura.getComprobanteNombreArchivo())
				.referenciaPago(factura.getReferenciaPago())
				.pagoRegistradoPorId(factura.getPagoRegistradoPorId())
				.pagoRegistradoPorNombre(factura.getPagoRegistradoPorNombre())
				.pagoRegistradoPorEmail(factura.getPagoRegistradoPorEmail())
				.fechaRegistroComprobante(factura.getFechaRegistroComprobante())
				.pagada(factura.getPagada())
				.build();
	}

	private String limpiarNombreArchivo(String nombre) {
		String seguro = (nombre == null || nombre.isBlank()) ? "comprobante" : nombre;
		return seguro.replaceAll("[^a-zA-Z0-9._-]", "_");
	}
}
