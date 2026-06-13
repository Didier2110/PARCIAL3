package com.innovation.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.innovation.entity.Inventario;
import com.innovation.repository.InventarioRepository;

@Service
public class InventarioService {

    @Autowired
    private InventarioRepository inventarioRepository;

    public Inventario crearItem(Inventario item) {
        if (item.getCantidad() == null || item.getCantidad() < 0) {
            throw new RuntimeException("La cantidad no puede ser negativa");
        }
        item.setFechaCreacion(LocalDateTime.now());
        if (item.getEstado() == null) item.setEstado("DISPONIBLE");
        if (item.getCantidadReservada() == null) item.setCantidadReservada(0);
        return inventarioRepository.save(item);
    }

    public Inventario obtenerPorId(String id) {
        return inventarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item no encontrado: " + id));
    }

    public List<Inventario> obtenerTodos() {
        return inventarioRepository.findAll();
    }

    public List<Inventario> obtenerPorCategoria(String categoria) {
        return inventarioRepository.findByCategoria(categoria);
    }

    public List<Inventario> obtenerStockBajo() {
        return inventarioRepository.findAll().stream()
                .filter(i -> i.getCantidad() != null
                          && i.getCantidadMinima() != null
                          && i.getCantidad() <= i.getCantidadMinima())
                .toList();
    }

    public Inventario actualizarItem(String id, Inventario datos) {
        Inventario item = obtenerPorId(id);
        if (datos.getNombre()       != null) item.setNombre(datos.getNombre());
        if (datos.getDescripcion()  != null) item.setDescripcion(datos.getDescripcion());
        if (datos.getCategoria()    != null) item.setCategoria(datos.getCategoria());
        if (datos.getUbicacion()    != null) item.setUbicacion(datos.getUbicacion());
        if (datos.getPrecioUnitario() != null) item.setPrecioUnitario(datos.getPrecioUnitario());
        if (datos.getCantidadMinima() != null) item.setCantidadMinima(datos.getCantidadMinima());
        item.setFechaActualizacion(LocalDateTime.now());
        return inventarioRepository.save(item);
    }

    /**
     * Ajusta el stock (+/-). Nunca permite que la cantidad disponible baje de cero.
     */
    public Inventario ajustarStock(String id, int delta, String motivo) {
        Inventario item = obtenerPorId(id);
        int nuevo = (item.getCantidad() != null ? item.getCantidad() : 0) + delta;
        if (nuevo < 0) {
            throw new RuntimeException(
                "Stock insuficiente. Disponible: " + item.getCantidad() + ", solicitado: " + Math.abs(delta));
        }
        item.setCantidad(nuevo);
        item.setFechaActualizacion(LocalDateTime.now());
        return inventarioRepository.save(item);
    }

    public void eliminarItem(String id) {
        inventarioRepository.deleteById(id);
    }
}
