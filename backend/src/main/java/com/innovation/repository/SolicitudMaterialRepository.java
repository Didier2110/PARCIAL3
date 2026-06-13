package com.innovation.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.innovation.entity.SolicitudMaterial;

@Repository
public interface SolicitudMaterialRepository extends MongoRepository<SolicitudMaterial, String> {

    List<SolicitudMaterial> findByTecnicoId(String tecnicoId);

    List<SolicitudMaterial> findByOrdenTrabajoId(String ordenTrabajoId);

    List<SolicitudMaterial> findByEstado(String estado);

    List<SolicitudMaterial> findByJefeBodegaId(String jefeBodegaId);
}
