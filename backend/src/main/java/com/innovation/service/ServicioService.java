package com.innovation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.innovation.dto.ServicioDTO;
import com.innovation.entity.Servicio;
import com.innovation.exception.ResourceNotFoundException;
import com.innovation.repository.ServicioRepository;

@Service
public class ServicioService {

	@Autowired
	private ServicioRepository servicioRepository;

	public Servicio crearServicio(Servicio servicio) {
		servicio.setFechaCreacion(LocalDateTime.now());
		servicio.setEstado("DISPONIBLE");
		servicio.setActivo(true);
		return servicioRepository.save(servicio);
	}

	public Servicio obtenerServicioById(String id) {
		Optional<Servicio> servicio = servicioRepository.findById(id);
		if (!servicio.isPresent()) {
			throw new ResourceNotFoundException("Servicio no encontrado con id: " + id);
		}
		return servicio.get();
	}

	public Servicio obtenerServicioPorNombre(String nombre) {
		Servicio servicio = servicioRepository.findByNombre(nombre);
		if (servicio == null) {
			throw new ResourceNotFoundException("Servicio no encontrado con nombre: " + nombre);
		}
		return servicio;
	}

	public List<Servicio> obtenerServiciosPorTipo(String tipo) {
		return servicioRepository.findByTipo(tipo);
	}

	public Servicio actualizarServicio(String id, Servicio servicioActualizado) {
		Servicio servicio = obtenerServicioById(id);
		servicio.setNombre(servicioActualizado.getNombre());
		servicio.setDescripcion(servicioActualizado.getDescripcion());
		servicio.setTipo(servicioActualizado.getTipo());
		servicio.setPrecioMensual(servicioActualizado.getPrecioMensual());
		servicio.setVelocidad(servicioActualizado.getVelocidad());
		servicio.setLimiteAncho(servicioActualizado.getLimiteAncho());
		servicio.setCaracteristicas(servicioActualizado.getCaracteristicas());
		servicio.setFechaActualizacion(LocalDateTime.now());
		return servicioRepository.save(servicio);
	}

	public void eliminarServicio(String id) {
		Servicio servicio = obtenerServicioById(id);
		servicio.setActivo(false);
		servicio.setEstado("INACTIVO");
		servicio.setFechaActualizacion(LocalDateTime.now());
		servicioRepository.save(servicio);
	}

	public List<Servicio> obtenerTodosLosServicios() {
		return servicioRepository.findAll();
	}

	public List<Servicio> obtenerServiciosActivos() {
		return servicioRepository.findByActivo(true);
	}

	public ServicioDTO convertirADTO(Servicio servicio) {
		return ServicioDTO.builder()
				.id(servicio.getId())
				.nombre(servicio.getNombre())
				.descripcion(servicio.getDescripcion())
				.tipo(servicio.getTipo())
				.precioMensual(servicio.getPrecioMensual())
				.velocidad(servicio.getVelocidad())
				.limiteAncho(servicio.getLimiteAncho())
				.estado(servicio.getEstado())
				.fechaCreacion(servicio.getFechaCreacion())
				.caracteristicas(servicio.getCaracteristicas())
				.activo(servicio.getActivo())
				.build();
	}
}
