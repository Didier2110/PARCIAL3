package com.innovation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.innovation.dto.ClienteDTO;
import com.innovation.entity.Cliente;
import com.innovation.exception.ResourceNotFoundException;
import com.innovation.repository.ClienteRepository;

@Service
public class ClienteService {

	@Autowired
	private ClienteRepository clienteRepository;

	public Cliente crearCliente(Cliente cliente) {
		if (clienteRepository.findByDocumento(cliente.getDocumento()) != null) {
			throw new RuntimeException("El documento ya existe");
		}
		cliente.setFechaCreacion(LocalDateTime.now());
		cliente.setEstado("ACTIVO");
		cliente.setActivo(true);
		return clienteRepository.save(cliente);
	}

	public Cliente obtenerClienteById(String id) {
		Optional<Cliente> cliente = clienteRepository.findById(id);
		if (!cliente.isPresent()) {
			throw new ResourceNotFoundException("Cliente no encontrado con id: " + id);
		}
		return cliente.get();
	}

	public Cliente obtenerClientePorDocumento(String documento) {
		Cliente cliente = clienteRepository.findByDocumento(documento);
		if (cliente == null) {
			throw new ResourceNotFoundException("Cliente no encontrado con documento: " + documento);
		}
		return cliente;
	}

	public List<Cliente> obtenerClientesPorUsuario(String usuarioId) {
		return clienteRepository.findByUsuarioId(usuarioId);
	}

	public List<Cliente> obtenerClientesPorCreador(String usuarioId) {
		return clienteRepository.findByCreadoPorUsuarioId(usuarioId);
	}

	public List<Cliente> obtenerClientesActivosPorCreador(String usuarioId) {
		return clienteRepository.findByActivoAndCreadoPorUsuarioId(true, usuarioId);
	}

	public Cliente actualizarCliente(String id, Cliente clienteActualizado) {
		Cliente cliente = obtenerClienteById(id);
		if (clienteActualizado.getDocumento() != null && !clienteActualizado.getDocumento().equals(cliente.getDocumento())) {
			Cliente existente = clienteRepository.findByDocumento(clienteActualizado.getDocumento());
			if (existente != null && !existente.getId().equals(id)) {
				throw new RuntimeException("El documento ya existe");
			}
			cliente.setDocumento(clienteActualizado.getDocumento());
		}
		cliente.setRazonSocial(clienteActualizado.getRazonSocial());
		cliente.setTipoDocumento(clienteActualizado.getTipoDocumento());
		cliente.setEmail(clienteActualizado.getEmail());
		cliente.setTelefono(clienteActualizado.getTelefono());
		cliente.setDireccion(clienteActualizado.getDireccion());
		cliente.setCiudad(clienteActualizado.getCiudad());
		cliente.setDepartamento(clienteActualizado.getDepartamento());
		cliente.setCodigoPostal(clienteActualizado.getCodigoPostal());
		cliente.setContactoPrincipal(clienteActualizado.getContactoPrincipal());
		cliente.setTelefonoContacto(clienteActualizado.getTelefonoContacto());
		cliente.setFechaActualizacion(LocalDateTime.now());
		return clienteRepository.save(cliente);
	}

	public void eliminarCliente(String id) {
		Cliente cliente = obtenerClienteById(id);
		cliente.setActivo(false);
		cliente.setEstado("INACTIVO");
		cliente.setFechaActualizacion(LocalDateTime.now());
		clienteRepository.save(cliente);
	}

	public List<Cliente> obtenerTodosLosClientes() {
		return clienteRepository.findAll();
	}

	public List<Cliente> obtenerClientesActivos() {
		return clienteRepository.findByActivo(true);
	}

	public ClienteDTO convertirADTO(Cliente cliente) {
		return ClienteDTO.builder()
				.id(cliente.getId())
				.razonSocial(cliente.getRazonSocial())
				.documento(cliente.getDocumento())
				.tipoDocumento(cliente.getTipoDocumento())
				.email(cliente.getEmail())
				.telefono(cliente.getTelefono())
				.direccion(cliente.getDireccion())
				.ciudad(cliente.getCiudad())
				.departamento(cliente.getDepartamento())
				.codigoPostal(cliente.getCodigoPostal())
				.estado(cliente.getEstado())
				.fechaCreacion(cliente.getFechaCreacion())
				.contactoPrincipal(cliente.getContactoPrincipal())
				.telefonoContacto(cliente.getTelefonoContacto())
				.creadoPorUsuarioId(cliente.getCreadoPorUsuarioId())
				.creadoPorEmail(cliente.getCreadoPorEmail())
				.activo(cliente.getActivo())
				.build();
	}
}
