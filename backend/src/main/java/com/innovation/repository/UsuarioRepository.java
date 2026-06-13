package com.innovation.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.innovation.entity.Usuario;

@Repository
public interface UsuarioRepository extends MongoRepository<Usuario, String> {

	Usuario findByEmail(String email);
	
	Usuario findByDocumento(String documento);
	
	Boolean existsByEmail(String email);
}
