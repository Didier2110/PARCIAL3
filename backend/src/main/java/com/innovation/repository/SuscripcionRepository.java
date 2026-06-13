package com.innovation.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.innovation.entity.Suscripcion;

@Repository
public interface SuscripcionRepository extends MongoRepository<Suscripcion, String> {

	Suscripcion findByNumeroContrato(String numeroContrato);
	
	java.util.List<Suscripcion> findByClienteId(String clienteId);
	
	java.util.List<Suscripcion> findByServicioId(String servicioId);

	java.util.List<Suscripcion> findByCreadoPorUsuarioId(String creadoPorUsuarioId);
	
	java.util.List<Suscripcion> findByActiva(Boolean activa);

	java.util.List<Suscripcion> findByActivaAndCreadoPorUsuarioId(Boolean activa, String creadoPorUsuarioId);
}
