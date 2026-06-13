package com.innovation.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.innovation.entity.Inventario;
import com.innovation.entity.SolicitudMaterial;
import com.innovation.entity.SolicitudMaterial.ItemSolicitud;
import com.innovation.repository.SolicitudMaterialRepository;

@Service
public class SolicitudMaterialService {

    @Autowired
    private SolicitudMaterialRepository solicitudRepository;

    @Autowired
    private InventarioService inventarioService;

    public SolicitudMaterial crearSolicitud(SolicitudMaterial solicitud) {
        solicitud.setEstado("PENDIENTE");
        solicitud.setFechaSolicitud(LocalDateTime.now());
        return solicitudRepository.save(solicitud);
    }

    public SolicitudMaterial obtenerPorId(String id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada: " + id));
    }

    public List<SolicitudMaterial> obtenerTodas() {
        return solicitudRepository.findAll();
    }

    public List<SolicitudMaterial> obtenerPorTecnico(String tecnicoId) {
        return solicitudRepository.findByTecnicoId(tecnicoId);
    }

    public List<SolicitudMaterial> obtenerPendientes() {
        return solicitudRepository.findByEstado("PENDIENTE");
    }

    /**
     * JEFE_BODEGA aprueba la solicitud y registra cantidades aprobadas.
     * También reserva el stock en inventario.
     */
    public SolicitudMaterial aprobarSolicitud(String id, String jefeBodegaId,
                                              List<ItemSolicitud> itemsAprobados,
                                              String observaciones) {
        SolicitudMaterial solicitud = obtenerPorId(id);
        if (!"PENDIENTE".equals(solicitud.getEstado())) {
            throw new RuntimeException("Solo se pueden aprobar solicitudes PENDIENTES");
        }

        // Verificar stock disponible antes de aprobar
        for (ItemSolicitud item : itemsAprobados) {
            if (item.getCantidadAprobada() != null && item.getCantidadAprobada() > 0) {
                Inventario inv = inventarioService.obtenerPorId(item.getInventarioId());
                int disponible = (inv.getCantidad() != null ? inv.getCantidad() : 0)
                               - (inv.getCantidadReservada() != null ? inv.getCantidadReservada() : 0);
                if (disponible < item.getCantidadAprobada()) {
                    throw new RuntimeException(
                        "Stock insuficiente para: " + inv.getNombre()
                        + ". Disponible: " + disponible
                        + ", Aprobado: " + item.getCantidadAprobada());
                }
                // Reservar en inventario
                inv.setCantidadReservada(
                    (inv.getCantidadReservada() != null ? inv.getCantidadReservada() : 0)
                    + item.getCantidadAprobada());
                inventarioService.actualizarItem(inv.getId(), inv);
            }
        }

        solicitud.setItems(itemsAprobados);
        solicitud.setEstado("APROBADA");
        solicitud.setJefeBodegaId(jefeBodegaId);
        solicitud.setObservacionesBodega(observaciones);
        solicitud.setFechaRespuesta(LocalDateTime.now());
        return solicitudRepository.save(solicitud);
    }

    /**
     * JEFE_BODEGA rechaza la solicitud.
     */
    public SolicitudMaterial rechazarSolicitud(String id, String jefeBodegaId, String observaciones) {
        SolicitudMaterial solicitud = obtenerPorId(id);
        solicitud.setEstado("RECHAZADA");
        solicitud.setJefeBodegaId(jefeBodegaId);
        solicitud.setObservacionesBodega(observaciones);
        solicitud.setFechaRespuesta(LocalDateTime.now());
        return solicitudRepository.save(solicitud);
    }

    /**
     * JEFE_BODEGA registra el despacho físico con número de remisión.
     * Descuenta el stock real del inventario.
     */
    public SolicitudMaterial despacharSolicitud(String id, String numeroDespachoPor) {
        SolicitudMaterial solicitud = obtenerPorId(id);
        if (!"APROBADA".equals(solicitud.getEstado())) {
            throw new RuntimeException("Solo se pueden despachar solicitudes APROBADAS");
        }

        // Descontar stock real y liberar reserva
        for (ItemSolicitud item : solicitud.getItems()) {
            if (item.getCantidadAprobada() != null && item.getCantidadAprobada() > 0) {
                // Ajustar stock (resta)
                inventarioService.ajustarStock(item.getInventarioId(), -item.getCantidadAprobada(), "Despacho " + numeroDespachoPor);
                // Liberar reserva
                Inventario inv = inventarioService.obtenerPorId(item.getInventarioId());
                int reservada = (inv.getCantidadReservada() != null ? inv.getCantidadReservada() : 0);
                inv.setCantidadReservada(Math.max(0, reservada - item.getCantidadAprobada()));
                inventarioService.actualizarItem(inv.getId(), inv);
            }
        }

        solicitud.setEstado("DESPACHADA");
        solicitud.setNumeroDespachoPor(numeroDespachoPor);
        solicitud.setFechaDespacho(LocalDateTime.now());
        return solicitudRepository.save(solicitud);
    }

    public void eliminarSolicitud(String id) {
        solicitudRepository.deleteById(id);
    }
}
