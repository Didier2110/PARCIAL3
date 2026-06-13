package com.innovation.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.innovation.entity.Cliente;
import com.innovation.entity.OrdenTrabajo;
import com.innovation.entity.Servicio;
import com.innovation.dto.SuscripcionDTO;
import com.innovation.entity.Suscripcion;
import com.innovation.exception.ResourceNotFoundException;
import com.innovation.repository.ClienteRepository;
import com.innovation.repository.ServicioRepository;
import com.innovation.repository.SuscripcionRepository;
import com.innovation.service.OrdenTrabajoService;

@Service
public class SuscripcionService {

	@Autowired
	private SuscripcionRepository suscripcionRepository;

	@Autowired
	private ClienteRepository clienteRepository;

	@Autowired
	private ServicioRepository servicioRepository;

	@Autowired
	private OrdenTrabajoService ordenTrabajoService;

	public Suscripcion crearSuscripcion(Suscripcion suscripcion) {
		suscripcion.setFechaCreacion(LocalDateTime.now());
		suscripcion.setEstado("ACTIVA");
		suscripcion.setActiva(true);
		suscripcion.setDiasRestantes(30);
		return suscripcionRepository.save(suscripcion);
	}

	public Suscripcion obtenerSuscripcionById(String id) {
		Optional<Suscripcion> suscripcion = suscripcionRepository.findById(id);
		if (!suscripcion.isPresent()) {
			throw new ResourceNotFoundException("Suscripción no encontrada con id: " + id);
		}
		return suscripcion.get();
	}

	public List<Suscripcion> obtenerSuscripcionesPorCliente(String clienteId) {
		return suscripcionRepository.findByClienteId(clienteId);
	}

	public List<Suscripcion> obtenerSuscripcionesPorServicio(String servicioId) {
		return suscripcionRepository.findByServicioId(servicioId);
	}

	public List<Suscripcion> obtenerSuscripcionesPorCreador(String usuarioId) {
		return suscripcionRepository.findByCreadoPorUsuarioId(usuarioId);
	}

	public List<Suscripcion> obtenerSuscripcionesActivasPorCreador(String usuarioId) {
		return suscripcionRepository.findByActivaAndCreadoPorUsuarioId(true, usuarioId);
	}

	public Suscripcion actualizarSuscripcion(String id, Suscripcion suscripcionActualizada) {
		Suscripcion suscripcion = obtenerSuscripcionById(id);
		if (suscripcionActualizada.getClienteId() != null) {
			suscripcion.setClienteId(suscripcionActualizada.getClienteId());
		}
		if (suscripcionActualizada.getServicioId() != null) {
			suscripcion.setServicioId(suscripcionActualizada.getServicioId());
		}
		if (suscripcionActualizada.getEstado() != null) {
			suscripcion.setEstado(suscripcionActualizada.getEstado());
		}
		suscripcion.setFechaFin(suscripcionActualizada.getFechaFin());
		suscripcion.setPrecioActual(suscripcionActualizada.getPrecioActual());
		suscripcion.setMetodoPago(suscripcionActualizada.getMetodoPago());
		suscripcion.setProximoVencimiento(suscripcionActualizada.getProximoVencimiento());
		suscripcion.setObservaciones(suscripcionActualizada.getObservaciones());
		suscripcion.setFechaActualizacion(LocalDateTime.now());
		return suscripcionRepository.save(suscripcion);
	}

	public void cancelarSuscripcion(String id) {
		Suscripcion suscripcion = obtenerSuscripcionById(id);
		suscripcion.setActiva(false);
		suscripcion.setEstado("CANCELADA");
		suscripcion.setFechaActualizacion(LocalDateTime.now());
		suscripcionRepository.save(suscripcion);
	}

	public List<Suscripcion> obtenerTodasLasSuscripciones() {
		return suscripcionRepository.findAll();
	}

	public List<Suscripcion> obtenerSuscripcionesActivas() {
		return suscripcionRepository.findByActiva(true);
	}

	public List<Suscripcion> obtenerSuscripcionesPorUsuario(String usuarioId) {
		List<Cliente> clientes = clienteRepository.findByUsuarioId(usuarioId);
		if (clientes.isEmpty()) {
			return new ArrayList<>();
		}
		return suscripcionRepository.findByClienteId(clientes.get(0).getId());
	}

	public Map<String, Object> solicitarServicioCliente(String usuarioId, String servicioId,
			String metodoPago, String observaciones, LocalDateTime fechaDeseada) {
		List<Cliente> clientes = clienteRepository.findByUsuarioId(usuarioId);
		if (clientes.isEmpty()) {
			throw new RuntimeException("No hay un cliente asociado al usuario autenticado");
		}

		Cliente cliente = clientes.stream()
				.filter(c -> Boolean.TRUE.equals(c.getActivo()))
				.findFirst()
				.orElse(clientes.get(0));

		Servicio servicio = servicioRepository.findById(servicioId)
				.orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado"));
		if (!Boolean.TRUE.equals(servicio.getActivo())) {
			throw new RuntimeException("El plan seleccionado no está activo");
		}

		List<Suscripcion> existentes = suscripcionRepository.findByClienteId(cliente.getId());
		boolean yaTieneSolicitud = existentes.stream().anyMatch(s ->
				servicioId.equals(s.getServicioId()) &&
				("PENDIENTE_INSTALACION".equalsIgnoreCase(s.getEstado()) || Boolean.TRUE.equals(s.getActiva())));
		if (yaTieneSolicitud) {
			throw new RuntimeException("Ya existe una suscripción o solicitud activa para este plan");
		}

		String numeroContrato = "CONT-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

		Suscripcion suscripcion = Suscripcion.builder()
				.clienteId(cliente.getId())
				.servicioId(servicio.getId())
				.numeroContrato(numeroContrato)
				.estado("PENDIENTE_INSTALACION")
				.precioActual(servicio.getPrecioMensual())
				.metodoPago(metodoPago == null || metodoPago.isBlank() ? "TRANSFERENCIA" : metodoPago)
				.observaciones(observaciones)
				.fechaCreacion(LocalDateTime.now())
				.activa(false)
				.diasRestantes(0)
				.build();
		suscripcion = suscripcionRepository.save(suscripcion);

		OrdenTrabajo orden = OrdenTrabajo.builder()
				.tipo("INSTALACION")
				.titulo("Instalación nueva solicitada por cliente")
				.descripcion("Solicitud desde portal cliente. Plan: " + servicio.getNombre())
				.clienteId(cliente.getId())
				.suscripcionId(suscripcion.getId())
				.direccion(cliente.getDireccion())
				.ciudad(cliente.getCiudad())
				.referencia("Generada automáticamente desde solicitud del cliente")
				.planInternet(servicio.getNombre())
				.incluyeTv(false)
				.fechaProgramada(fechaDeseada != null ? fechaDeseada : LocalDateTime.now().plusDays(2))
				.build();
		OrdenTrabajo ordenCreada = ordenTrabajoService.crearOrden(orden);

		return Map.of(
				"message", "Solicitud creada y enviada a coordinación para asignación",
				"suscripcionId", suscripcion.getId(),
				"ordenTrabajoId", ordenCreada.getId(),
				"estado", suscripcion.getEstado());
	}

	public SuscripcionDTO convertirADTO(Suscripcion suscripcion) {
		String nombreServicio = null;
		if (suscripcion.getServicioId() != null) {
			nombreServicio = servicioRepository.findById(suscripcion.getServicioId())
					.map(Servicio::getNombre)
					.orElse(null);
		}

		return SuscripcionDTO.builder()
				.id(suscripcion.getId())
				.clienteId(suscripcion.getClienteId())
				.servicioId(suscripcion.getServicioId())
				.nombreServicio(nombreServicio)
				.numeroContrato(suscripcion.getNumeroContrato())
				.estado(suscripcion.getEstado())
				.fechaInicio(suscripcion.getFechaInicio())
				.fechaFin(suscripcion.getFechaFin())
				.precioActual(suscripcion.getPrecioActual())
				.metodoPago(suscripcion.getMetodoPago())
				.proximoVencimiento(suscripcion.getProximoVencimiento())
				.diasRestantes(suscripcion.getDiasRestantes())
				.fechaCreacion(suscripcion.getFechaCreacion())
				.observaciones(suscripcion.getObservaciones())
				.creadoPorUsuarioId(suscripcion.getCreadoPorUsuarioId())
				.creadoPorEmail(suscripcion.getCreadoPorEmail())
				.activa(suscripcion.getActiva())
				.build();
	}
}
