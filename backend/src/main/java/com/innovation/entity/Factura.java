package com.innovation.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "facturas")
public class Factura {

	@Id
	private String id;
	
	private String suscripcionId;
	private String numeroFactura;
	private String estado;
	private String periodoFacturado;
	private LocalDateTime fechaEmision;
	private LocalDateTime fechaVencimiento;
	private LocalDateTime fechaInicioPeriodo;
	private LocalDateTime fechaFinPeriodo;
	private Double subtotal;
	private Double impuestos;
	private Double total;
	private String metodoPago;
	private LocalDateTime fechaPago;
	private String comprobantePago;
	private String comprobanteNombreArchivo;
	private String comprobanteTipoContenido;
	private String comprobanteRuta;
	private String referenciaPago;
	private String pagoRegistradoPorId;
	private String pagoRegistradoPorNombre;
	private String pagoRegistradoPorEmail;
	private LocalDateTime fechaRegistroComprobante;
	private LocalDateTime fechaCreacion;
	private LocalDateTime fechaActualizacion;
	
	@Builder.Default
	private Boolean pagada = false;
}
