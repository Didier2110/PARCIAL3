package com.innovation.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.innovation.entity.Factura;

@Repository
public interface FacturaRepository extends MongoRepository<Factura, String> {

	Factura findByNumeroFactura(String numeroFactura);
	
	java.util.List<Factura> findBySuscripcionId(String suscripcionId);
	
	java.util.List<Factura> findByEstado(String estado);
	
	java.util.List<Factura> findByPagada(Boolean pagada);

	Factura findBySuscripcionIdAndPeriodoFacturado(String suscripcionId, String periodoFacturado);
}
