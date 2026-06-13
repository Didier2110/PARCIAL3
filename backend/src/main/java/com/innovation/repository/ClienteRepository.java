package com.innovation.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.innovation.entity.Cliente;

@Repository
public interface ClienteRepository extends MongoRepository<Cliente, String> {

	Cliente findByDocumento(String documento);
	
	Cliente findByEmail(String email);
	
	java.util.List<Cliente> findByUsuarioId(String usuarioId);

	java.util.List<Cliente> findByCreadoPorUsuarioId(String creadoPorUsuarioId);
	
	java.util.List<Cliente> findByActivo(Boolean activo);

	java.util.List<Cliente> findByActivoAndCreadoPorUsuarioId(Boolean activo, String creadoPorUsuarioId);
}
