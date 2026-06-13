package com.innovation.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.innovation.entity.Servicio;

@Repository
public interface ServicioRepository extends MongoRepository<Servicio, String> {

	Servicio findByNombre(String nombre);
	
	java.util.List<Servicio> findByTipo(String tipo);
	
	java.util.List<Servicio> findByActivo(Boolean activo);
}
