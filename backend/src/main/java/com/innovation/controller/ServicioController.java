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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.innovation.dto.ServicioDTO;
import com.innovation.entity.Servicio;
import com.innovation.service.ServicioService;

@RestController
@RequestMapping("/api/v1/servicios")
public class ServicioController {

	@Autowired
	private ServicioService servicioService;

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping
	public ResponseEntity<?> crearServicio(@RequestBody Servicio servicio) {
		try {
			Servicio servicioCreado = servicioService.crearServicio(servicio);
			return ResponseEntity.status(HttpStatus.CREATED).body(servicioService.convertirADTO(servicioCreado));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("isAuthenticated()")
	@GetMapping("/{id}")
	public ResponseEntity<?> obtenerServicio(@PathVariable String id) {
		try {
			Servicio servicio = servicioService.obtenerServicioById(id);
			return ResponseEntity.ok(servicioService.convertirADTO(servicio));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("isAuthenticated()")
	@GetMapping
	public ResponseEntity<List<ServicioDTO>> obtenerTodosLosServicios() {
		List<ServicioDTO> servicios = servicioService.obtenerTodosLosServicios().stream()
				.map(servicioService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(servicios);
	}

	@PreAuthorize("isAuthenticated()")
	@GetMapping("/activos/todos")
	public ResponseEntity<List<ServicioDTO>> obtenerServiciosActivos() {
		List<ServicioDTO> servicios = servicioService.obtenerServiciosActivos().stream()
				.map(servicioService::convertirADTO)
				.collect(Collectors.toList());
		return ResponseEntity.ok(servicios);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}")
	public ResponseEntity<?> actualizarServicio(@PathVariable String id, @RequestBody Servicio servicio) {
		try {
			Servicio servicioActualizado = servicioService.actualizarServicio(id, servicio);
			return ResponseEntity.ok(servicioService.convertirADTO(servicioActualizado));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
		}
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id}")
	public ResponseEntity<?> eliminarServicio(@PathVariable String id) {
		try {
			servicioService.eliminarServicio(id);
			return ResponseEntity.ok("Servicio eliminado exitosamente");
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
		}
	}
}
