package com.innovation.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacturaDTO {

	private String id;
	private String suscripcionId;
	private String clienteNombre;
	private String servicioNombre;
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
	private String referenciaPago;
	private String pagoRegistradoPorId;
	private String pagoRegistradoPorNombre;
	private String pagoRegistradoPorEmail;
	private LocalDateTime fechaRegistroComprobante;
	private Boolean pagada;
}
