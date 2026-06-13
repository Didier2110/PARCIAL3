package com.innovation.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.innovation.entity.OrdenTrabajo;
import com.innovation.entity.OrdenTrabajo.FaseTrabajo;
import com.innovation.repository.OrdenTrabajoRepository;

@Service
public class OrdenTrabajoService {

    @Autowired
    private OrdenTrabajoRepository ordenRepository;

    // ===== Fases estándar por tipo de orden =====
    private List<FaseTrabajo> fasesDefault(String tipo) {
        List<FaseTrabajo> fases = new ArrayList<>();
        if ("INSTALACION".equals(tipo)) {
            fases.add(FaseTrabajo.builder().orden(1).nombre("Verificación de señal").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(2).nombre("Tendido de cable").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(3).nombre("Instalación de equipo").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(4).nombre("Configuración de red").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(5).nombre("Prueba de velocidad").estado("PENDIENTE").build());
        } else if ("MANTENIMIENTO".equals(tipo)) {
            fases.add(FaseTrabajo.builder().orden(1).nombre("Diagnóstico").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(2).nombre("Corrección").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(3).nombre("Verificación final").estado("PENDIENTE").build());
        } else if ("AVERIA".equals(tipo)) {
            fases.add(FaseTrabajo.builder().orden(1).nombre("Inspección en sitio").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(2).nombre("Identificación de falla").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(3).nombre("Reparación").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(4).nombre("Prueba de servicio").estado("PENDIENTE").build());
        } else if ("RETIRO".equals(tipo)) {
            fases.add(FaseTrabajo.builder().orden(1).nombre("Desconexión del servicio").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(2).nombre("Retiro de equipos").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(3).nombre("Entrega de equipos en bodega").estado("PENDIENTE").build());
        } else {
            fases.add(FaseTrabajo.builder().orden(1).nombre("Ejecución").estado("PENDIENTE").build());
            fases.add(FaseTrabajo.builder().orden(2).nombre("Verificación").estado("PENDIENTE").build());
        }
        return fases;
    }

    public OrdenTrabajo crearOrden(OrdenTrabajo orden) {
        orden.setEstado("PENDIENTE");
        orden.setFechaCreacion(LocalDateTime.now());
        if (orden.getFases() == null || orden.getFases().isEmpty()) {
            orden.setFases(fasesDefault(orden.getTipo()));
        }
        return ordenRepository.save(orden);
    }

    public OrdenTrabajo obtenerPorId(String id) {
        return ordenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada: " + id));
    }

    public List<OrdenTrabajo> obtenerTodas() {
        return ordenRepository.findAll();
    }

    public List<OrdenTrabajo> obtenerPorTecnico(String tecnicoId) {
        return ordenRepository.findByTecnicoId(tecnicoId);
    }

    public List<OrdenTrabajo> obtenerPorCliente(String clienteId) {
        return ordenRepository.findByClienteId(clienteId);
    }

    public List<OrdenTrabajo> obtenerPorEstado(String estado) {
        return ordenRepository.findByEstado(estado);
    }

    public List<OrdenTrabajo> obtenerPorSemana(LocalDateTime inicio, LocalDateTime fin) {
        return ordenRepository.findByFechaProgramadaBetween(inicio, fin);
    }

    public List<OrdenTrabajo> obtenerPorTecnicoYSemana(String tecnicoId, LocalDateTime inicio, LocalDateTime fin) {
        return ordenRepository.findByTecnicoIdAndFechaProgramadaBetween(tecnicoId, inicio, fin);
    }

    /** JEFE_CUADRILLA asigna un técnico a la orden */
    public OrdenTrabajo asignarTecnico(String id, String tecnicoId) {
        OrdenTrabajo orden = obtenerPorId(id);
        orden.setTecnicoId(tecnicoId);
        orden.setEstado("ASIGNADA");
        orden.setFechaActualizacion(LocalDateTime.now());
        return ordenRepository.save(orden);
    }

    /** TECNICO inicia la orden */
    public OrdenTrabajo iniciarOrden(String id) {
        OrdenTrabajo orden = obtenerPorId(id);
        orden.setEstado("EN_PROGRESO");
        orden.setFechaInicio(LocalDateTime.now());
        orden.setFechaActualizacion(LocalDateTime.now());
        return ordenRepository.save(orden);
    }

    /** TECNICO actualiza una fase */
    public OrdenTrabajo actualizarFase(String id, int indice, String estado, String observaciones) {
        OrdenTrabajo orden = obtenerPorId(id);
        List<FaseTrabajo> fases = orden.getFases();
        if (indice < 0 || indice >= fases.size()) {
            throw new RuntimeException("Índice de fase inválido");
        }
        FaseTrabajo fase = fases.get(indice);
        fase.setEstado(estado);
        fase.setObservaciones(observaciones);
        if ("COMPLETADA".equals(estado)) {
            fase.setFechaCompletado(LocalDateTime.now());
        }
        orden.setFechaActualizacion(LocalDateTime.now());
        return ordenRepository.save(orden);
    }

    /** TECNICO cierra la orden (envía a validación del jefe) */
    public OrdenTrabajo cerrarOrden(String id, String observacionesTecnico) {
        OrdenTrabajo orden = obtenerPorId(id);
        orden.setEstado("COMPLETADA");
        orden.setFechaCierre(LocalDateTime.now());
        orden.setObservacionesTecnico(observacionesTecnico);
        orden.setFechaActualizacion(LocalDateTime.now());
        return ordenRepository.save(orden);
    }

    /** JEFE_CUADRILLA valida o rechaza */
    public OrdenTrabajo validarOrden(String id, boolean aprobada, String observaciones) {
        OrdenTrabajo orden = obtenerPorId(id);
        orden.setEstado(aprobada ? "VALIDADA" : "RECHAZADA");
        orden.setObservacionesJefe(observaciones);
        orden.setFechaValidacion(LocalDateTime.now());
        orden.setFechaActualizacion(LocalDateTime.now());
        return ordenRepository.save(orden);
    }

    /** Agrega foto (ID de GridFS) a la orden */
    public OrdenTrabajo agregarFoto(String id, String fotoId) {
        OrdenTrabajo orden = obtenerPorId(id);
        List<String> fotos = orden.getFotosIds();
        if (fotos == null) fotos = new ArrayList<>();
        fotos.add(fotoId);
        orden.setFotosIds(fotos);
        orden.setFechaActualizacion(LocalDateTime.now());
        return ordenRepository.save(orden);
    }

    public OrdenTrabajo actualizarOrden(String id, OrdenTrabajo datos) {
        OrdenTrabajo orden = obtenerPorId(id);
        if (datos.getTitulo()        != null) orden.setTitulo(datos.getTitulo());
        if (datos.getDescripcion()   != null) orden.setDescripcion(datos.getDescripcion());
        if (datos.getDireccion()     != null) orden.setDireccion(datos.getDireccion());
        if (datos.getFechaProgramada() != null) orden.setFechaProgramada(datos.getFechaProgramada());
        if (datos.getEstado()        != null) orden.setEstado(datos.getEstado());
        orden.setFechaActualizacion(LocalDateTime.now());
        return ordenRepository.save(orden);
    }

    public void eliminarOrden(String id) {
        ordenRepository.deleteById(id);
    }
}
