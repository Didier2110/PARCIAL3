package com.innovation.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.innovation.dto.TicketDTO;
import com.innovation.entity.Ticket;
import com.innovation.service.TicketService;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

	@Autowired
	private TicketService ticketService;

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','JEFE_BODEGA','CLIENTE','VENDEDOR','PUNTO_VENTA')")
	@PostMapping
	public ResponseEntity<?> crearTicket(@RequestBody Ticket ticket) {
		try {
			Ticket ticketCreado = ticketService.crearTicket(ticket);
			return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.convertirADTO(ticketCreado));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','JEFE_BODEGA','CLIENTE','VENDEDOR','PUNTO_VENTA')")
	@GetMapping("/{id}")
	public ResponseEntity<?> obtenerTicket(@PathVariable String id) {
		try {
			Ticket ticket = ticketService.obtenerTicketById(id);
			return ResponseEntity.ok(ticketService.convertirADTO(ticket));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','JEFE_BODEGA')")
	@GetMapping
	public ResponseEntity<List<TicketDTO>> obtenerTodosLosTickets() {
		List<TicketDTO> tickets = ticketService.obtenerTodosLosTickets().stream()
				.map(ticketService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(tickets);
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','JEFE_BODEGA','CLIENTE','VENDEDOR','PUNTO_VENTA')")
	@GetMapping("/cliente/{clienteId}")
	public ResponseEntity<List<TicketDTO>> obtenerTicketsPorCliente(@PathVariable String clienteId) {
		List<TicketDTO> tickets = ticketService.obtenerTicketsPorCliente(clienteId).stream()
				.map(ticketService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(tickets);
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','JEFE_BODEGA')")
	@GetMapping("/estado/{estado}")
	public ResponseEntity<List<TicketDTO>> obtenerTicketsPorEstado(@PathVariable String estado) {
		List<TicketDTO> tickets = ticketService.obtenerTicketsPorEstado(estado).stream()
				.map(ticketService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(tickets);
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','JEFE_BODEGA')")
	@GetMapping("/abiertos/todos")
	public ResponseEntity<List<TicketDTO>> obtenerTicketsAbiertos() {
		List<TicketDTO> tickets = ticketService.obtenerTicketsAbiertos().stream()
				.map(ticketService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(tickets);
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','JEFE_BODEGA')")
	@PutMapping("/{id}")
	public ResponseEntity<?> actualizarTicket(@PathVariable String id, @RequestBody Ticket ticket) {
		try {
			Ticket ticketActualizado = ticketService.actualizarTicket(id, ticket);
			return ResponseEntity.ok(ticketService.convertirADTO(ticketActualizado));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','JEFE_BODEGA')")
	@PatchMapping("/{id}/estado/{estado}")
	public ResponseEntity<?> cambiarEstadoTicket(@PathVariable String id, @PathVariable String estado) {
		try {
			Ticket ticket = ticketService.cambiarEstado(id, estado);
			return ResponseEntity.ok(ticketService.convertirADTO(ticket));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','JEFE_BODEGA')")
	@PostMapping("/{id}/resolver")
	public ResponseEntity<?> resolverTicket(@PathVariable String id, @RequestBody java.util.Map<String, String> request) {
		try {
			String solucion = request.get("solucion");
			Ticket ticket = ticketService.resolverTicket(id, solucion);
			return ResponseEntity.ok(ticketService.convertirADTO(ticket));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN','SOPORTE','JEFE_BODEGA')")
	@DeleteMapping("/{id}")
	public ResponseEntity<?> cerrarTicket(@PathVariable String id) {
		try {
			ticketService.cerrarTicket(id);
			return ResponseEntity.ok("Ticket cerrado exitosamente");
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
		}
	}
}
