package com.innovation.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.innovation.entity.OrdenTrabajo;

@Repository
public interface OrdenTrabajoRepository extends MongoRepository<OrdenTrabajo, String> {

    List<OrdenTrabajo> findByTecnicoId(String tecnicoId);

    List<OrdenTrabajo> findByClienteId(String clienteId);

    List<OrdenTrabajo> findByEstado(String estado);

    List<OrdenTrabajo> findByJefeCuadrillaId(String jefeCuadrillaId);

    List<OrdenTrabajo> findByTecnicoIdAndEstado(String tecnicoId, String estado);

    List<OrdenTrabajo> findByFechaProgramadaBetween(LocalDateTime inicio, LocalDateTime fin);

    List<OrdenTrabajo> findByTecnicoIdAndFechaProgramadaBetween(
            String tecnicoId, LocalDateTime inicio, LocalDateTime fin);
}
