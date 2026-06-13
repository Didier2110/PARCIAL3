package com.innovation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.innovation.dto.TicketDTO;
import com.innovation.entity.Ticket;
import com.innovation.exception.ResourceNotFoundException;
import com.innovation.repository.TicketRepository;

@Service
public class TicketService {

	@Autowired
	private TicketRepository ticketRepository;

	public Ticket crearTicket(Ticket ticket) {
		ticket.setFechaCreacion(LocalDateTime.now());
		ticket.setEstado(normalizarEstado(ticket.getEstado(), "ABIERTO"));
		ticket.setAbierto(true);
		return ticketRepository.save(ticket);
	}

	public Ticket obtenerTicketById(String id) {
		Optional<Ticket> ticket = ticketRepository.findById(id);
		if (!ticket.isPresent()) {
			throw new ResourceNotFoundException("Ticket no encontrado con id: " + id);
		}
		return ticket.get();
	}

	public List<Ticket> obtenerTicketsPorCliente(String clienteId) {
		return ticketRepository.findByClienteId(clienteId);
	}

	public List<Ticket> obtenerTicketsPorEstado(String estado) {
		return ticketRepository.findByEstado(normalizarEstado(estado, estado));
	}

	public List<Ticket> obtenerTicketsPorPrioridad(String prioridad) {
		return ticketRepository.findByPrioridad(prioridad);
	}

	public Ticket actualizarTicket(String id, Ticket ticketActualizado) {
		Ticket ticket = obtenerTicketById(id);
		if (ticketActualizado.getAsunto() != null) {
			ticket.setAsunto(ticketActualizado.getAsunto());
		}
		if (ticketActualizado.getDescripcion() != null) {
			ticket.setDescripcion(ticketActualizado.getDescripcion());
		}
		if (ticketActualizado.getCategoria() != null) {
			ticket.setCategoria(ticketActualizado.getCategoria());
		}
		if (ticketActualizado.getPrioridad() != null) {
			ticket.setPrioridad(ticketActualizado.getPrioridad());
		}
		if (ticketActualizado.getUsuarioAsignadoId() != null) {
			ticket.setUsuarioAsignadoId(ticketActualizado.getUsuarioAsignadoId());
		}
		if (ticketActualizado.getEstado() != null) {
			String estado = normalizarEstado(ticketActualizado.getEstado(), ticket.getEstado());
			ticket.setEstado(estado);
			ticket.setAbierto(esEstadoAbierto(estado));
			if ("RESUELTO".equals(estado) && ticket.getFechaResolucion() == null) {
				ticket.setFechaResolucion(LocalDateTime.now());
			}
		}
		ticket.setFechaActualizacion(LocalDateTime.now());
		return ticketRepository.save(ticket);
	}

	public Ticket cambiarEstado(String id, String nuevoEstado) {
		Ticket ticket = obtenerTicketById(id);
		String estado = normalizarEstado(nuevoEstado, ticket.getEstado());
		ticket.setEstado(estado);
		ticket.setAbierto(esEstadoAbierto(estado));
		if ("RESUELTO".equals(estado) && ticket.getFechaResolucion() == null) {
			ticket.setFechaResolucion(LocalDateTime.now());
		}
		ticket.setFechaActualizacion(LocalDateTime.now());
		return ticketRepository.save(ticket);
	}

	public Ticket resolverTicket(String id, String solucion) {
		Ticket ticket = obtenerTicketById(id);
		ticket.setEstado("RESUELTO");
		ticket.setAbierto(false);
		ticket.setSolucion(solucion);
		ticket.setFechaResolucion(LocalDateTime.now());
		ticket.setFechaActualizacion(LocalDateTime.now());
		return ticketRepository.save(ticket);
	}

	public void cerrarTicket(String id) {
		Ticket ticket = obtenerTicketById(id);
		ticket.setEstado("CERRADO");
		ticket.setAbierto(false);
		ticket.setFechaActualizacion(LocalDateTime.now());
		ticketRepository.save(ticket);
	}

	public List<Ticket> obtenerTodosLosTickets() {
		return ticketRepository.findAll();
	}

	public List<Ticket> obtenerTicketsAbiertos() {
		return ticketRepository.findByAbierto(true);
	}

	public TicketDTO convertirADTO(Ticket ticket) {
		return TicketDTO.builder()
				.id(ticket.getId())
				.clienteId(ticket.getClienteId())
				.asunto(ticket.getAsunto())
				.descripcion(ticket.getDescripcion())
				.categoria(ticket.getCategoria())
				.prioridad(ticket.getPrioridad())
				.estado(ticket.getEstado())
				.usuarioAsignadoId(ticket.getUsuarioAsignadoId())
				.fechaCreacion(ticket.getFechaCreacion())
				.fechaActualizacion(ticket.getFechaActualizacion())
				.fechaResolucion(ticket.getFechaResolucion())
				.solucion(ticket.getSolucion())
				.tiempoResolucionMinutos(ticket.getTiempoResolucionMinutos())
				.abierto(ticket.getAbierto())
				.build();
	}

	private String normalizarEstado(String estado, String valorPorDefecto) {
		if (estado == null || estado.isBlank()) {
			return valorPorDefecto;
		}
		String normalizado = estado.trim().toUpperCase().replace("-", "_").replace(" ", "_");
		return switch (normalizado) {
			case "ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO" -> normalizado;
			case "EN_PROCESO" -> "EN_PROGRESO";
			default -> valorPorDefecto;
		};
	}

	private boolean esEstadoAbierto(String estado) {
		return "ABIERTO".equals(estado) || "EN_PROGRESO".equals(estado);
	}
}
