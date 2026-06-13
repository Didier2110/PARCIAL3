package com.innovation.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.innovation.entity.Inventario;

@Repository
public interface InventarioRepository extends MongoRepository<Inventario, String> {

    List<Inventario> findByCategoria(String categoria);

    List<Inventario> findByEstado(String estado);

    List<Inventario> findByNumeroSerie(String numeroSerie);

    List<Inventario> findByCantidadLessThanEqual(Integer umbral);
}
