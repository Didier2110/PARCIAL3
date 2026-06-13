package com.innovation.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.innovation.entity.Ticket;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {

	java.util.List<Ticket> findByClienteId(String clienteId);
	
	java.util.List<Ticket> findByEstado(String estado);
	
	java.util.List<Ticket> findByPrioridad(String prioridad);
	
	java.util.List<Ticket> findByAbierto(Boolean abierto);
}
