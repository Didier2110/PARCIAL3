package com.innovation.service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.innovation.entity.Cliente;
import com.innovation.entity.Factura;
import com.innovation.entity.Servicio;
import com.innovation.entity.Suscripcion;
import com.innovation.exception.ResourceNotFoundException;
import com.innovation.repository.ClienteRepository;
import com.innovation.repository.FacturaRepository;
import com.innovation.repository.ServicioRepository;
import com.innovation.repository.SuscripcionRepository;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class PdfDocumentService {

	private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
	private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
	private static final Color AZUL = new Color(3, 33, 67);
	private static final Color CELESTE = new Color(0, 132, 255);
	private static final Color GRIS_CLARO = new Color(244, 248, 252);

	@Autowired
	private FacturaRepository facturaRepository;

	@Autowired
	private SuscripcionRepository suscripcionRepository;

	@Autowired
	private ClienteRepository clienteRepository;

	@Autowired
	private ServicioRepository servicioRepository;

	public byte[] generarFacturaPdf(String facturaId) {
		Factura factura = facturaRepository.findById(facturaId)
				.orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada"));
		Suscripcion suscripcion = obtenerSuscripcion(factura.getSuscripcionId());
		Cliente cliente = obtenerCliente(suscripcion.getClienteId());
		Servicio servicio = obtenerServicio(suscripcion.getServicioId());

		return crearDocumento(document -> {
			encabezado(document, "FACTURA DE SERVICIO ISP", factura.getNumeroFactura());
			tituloSeccion(document, "Datos del cliente");
			document.add(tablaDatos(new String[][] {
					{ "Cliente", texto(cliente.getRazonSocial()) },
					{ "Documento", texto(cliente.getTipoDocumento()) + " " + texto(cliente.getDocumento()) },
					{ "Correo", texto(cliente.getEmail()) },
					{ "Telefono", texto(cliente.getTelefono()) },
					{ "Ciudad", texto(cliente.getCiudad()) }
			}));

			tituloSeccion(document, "Detalle de facturacion");
			document.add(tablaDatos(new String[][] {
					{ "Plan", texto(servicio.getNombre()) },
					{ "Contrato", texto(suscripcion.getNumeroContrato()) },
					{ "Periodo", texto(factura.getPeriodoFacturado()) },
					{ "Emision", fecha(factura.getFechaEmision()) },
					{ "Vencimiento", fecha(factura.getFechaVencimiento()) },
					{ "Estado", Boolean.TRUE.equals(factura.getPagada()) ? "PAGADA" : texto(factura.getEstado()) }
			}));

			PdfPTable valores = new PdfPTable(new float[] { 3, 1 });
			valores.setWidthPercentage(100);
			celdaHeader(valores, "Concepto");
			celdaHeader(valores, "Valor");
			celda(valores, "Servicio mensual " + texto(servicio.getNombre()));
			celdaDerecha(valores, moneda(factura.getSubtotal()));
			celda(valores, "Impuestos");
			celdaDerecha(valores, moneda(factura.getImpuestos()));
			celdaTotal(valores, "Total a pagar");
			celdaTotalDerecha(valores, moneda(factura.getTotal()));
			document.add(valores);

			if (Boolean.TRUE.equals(factura.getPagada())) {
				tituloSeccion(document, "Pago registrado");
				document.add(tablaDatos(new String[][] {
						{ "Metodo", texto(factura.getMetodoPago()) },
						{ "Referencia", texto(factura.getReferenciaPago()) },
						{ "Registrado por", texto(factura.getPagoRegistradoPorNombre()) },
						{ "Fecha y hora", fechaHora(factura.getFechaRegistroComprobante()) }
				}));
			}

			pie(document);
		});
	}

	public byte[] generarContratoPdf(String suscripcionId) {
		Suscripcion suscripcion = obtenerSuscripcion(suscripcionId);
		Cliente cliente = obtenerCliente(suscripcion.getClienteId());
		Servicio servicio = obtenerServicio(suscripcion.getServicioId());

		return crearDocumento(document -> {
			encabezado(document, "CONTRATO DE SERVICIO ISP", suscripcion.getNumeroContrato());
			tituloSeccion(document, "Partes del contrato");
			document.add(tablaDatos(new String[][] {
					{ "Proveedor", "Innovation Telecomunicaciones S.A.S." },
					{ "Cliente", texto(cliente.getRazonSocial()) },
					{ "Documento", texto(cliente.getTipoDocumento()) + " " + texto(cliente.getDocumento()) },
					{ "Correo", texto(cliente.getEmail()) },
					{ "Direccion", texto(cliente.getDireccion()) },
					{ "Ciudad", texto(cliente.getCiudad()) }
			}));

			tituloSeccion(document, "Plan contratado");
			document.add(tablaDatos(new String[][] {
					{ "Plan", texto(servicio.getNombre()) },
					{ "Tipo", texto(servicio.getTipo()) },
					{ "Velocidad", texto(servicio.getVelocidad()) },
					{ "Valor mensual", moneda(valorSuscripcion(suscripcion, servicio)) },
					{ "Metodo de pago", texto(suscripcion.getMetodoPago()) },
					{ "Estado", texto(suscripcion.getEstado()) },
					{ "Fecha de inicio", fecha(Optional.ofNullable(suscripcion.getFechaInicio()).orElse(suscripcion.getFechaCreacion())) }
			}));

			tituloSeccion(document, "Condiciones del servicio");
			listaCondiciones(document);
			firmas(document);
			pie(document);
		});
	}

	private byte[] crearDocumento(DocumentWriter writer) {
		try {
			ByteArrayOutputStream output = new ByteArrayOutputStream();
			Document document = new Document(PageSize.LETTER, 42, 42, 40, 40);
			PdfWriter.getInstance(document, output);
			document.open();
			writer.write(document);
			document.close();
			return output.toByteArray();
		} catch (Exception e) {
			throw new RuntimeException("No se pudo generar el PDF", e);
		}
	}

	private void encabezado(Document document, String titulo, String consecutivo) throws Exception {
		PdfPTable table = new PdfPTable(new float[] { 2, 1 });
		table.setWidthPercentage(100);
		PdfPCell marca = new PdfPCell();
		marca.setBorder(Rectangle.NO_BORDER);
		Paragraph empresa = new Paragraph("innovation", fuente(28, Font.BOLD, AZUL));
		empresa.add(new Chunk("\nSOPORTE TECNICO ISP", fuente(9, Font.NORMAL, CELESTE)));
		marca.addElement(empresa);
		table.addCell(marca);

		PdfPCell info = new PdfPCell();
		info.setBorder(Rectangle.NO_BORDER);
		info.setHorizontalAlignment(Element.ALIGN_RIGHT);
		Paragraph p = new Paragraph(titulo, fuente(13, Font.BOLD, AZUL));
		p.setAlignment(Element.ALIGN_RIGHT);
		p.add(new Chunk("\n" + texto(consecutivo), fuente(10, Font.BOLD, Color.DARK_GRAY)));
		p.add(new Chunk("\nGenerado: " + fechaHora(LocalDateTime.now()), fuente(8, Font.NORMAL, Color.GRAY)));
		info.addElement(p);
		table.addCell(info);
		document.add(table);
		document.add(Chunk.NEWLINE);
	}

	private void tituloSeccion(Document document, String texto) throws Exception {
		Paragraph p = new Paragraph(texto, fuente(12, Font.BOLD, AZUL));
		p.setSpacingBefore(10);
		p.setSpacingAfter(6);
		document.add(p);
	}

	private PdfPTable tablaDatos(String[][] datos) {
		PdfPTable table = new PdfPTable(new float[] { 1, 2.4f });
		table.setWidthPercentage(100);
		for (String[] fila : datos) {
			celdaLabel(table, fila[0]);
			celda(table, fila[1]);
		}
		return table;
	}

	private void listaCondiciones(Document document) throws Exception {
		String[] condiciones = {
				"El servicio se factura mensualmente segun el plan contratado.",
				"El cliente debe pagar dentro de las fechas establecidas en la factura mensual.",
				"Los soportes tecnicos se gestionan mediante tickets y ordenes de trabajo.",
				"La suspension o retiro del servicio se tramita con validacion administrativa y tecnica.",
				"Este documento es soporte comercial del contrato registrado en el sistema."
		};
		for (String condicion : condiciones) {
			Paragraph p = new Paragraph("- " + condicion, fuente(9, Font.NORMAL, Color.DARK_GRAY));
			p.setSpacingAfter(4);
			document.add(p);
		}
	}

	private void firmas(Document document) throws Exception {
		document.add(Chunk.NEWLINE);
		PdfPTable table = new PdfPTable(2);
		table.setWidthPercentage(100);
		celdaFirma(table, "Innovation Telecomunicaciones S.A.S.");
		celdaFirma(table, "Cliente");
		document.add(table);
	}

	private void pie(Document document) throws Exception {
		Paragraph p = new Paragraph("Documento generado por Innovation Telecomunicaciones S.A.S.", fuente(8, Font.NORMAL, Color.GRAY));
		p.setAlignment(Element.ALIGN_CENTER);
		p.setSpacingBefore(18);
		document.add(p);
	}

	private Suscripcion obtenerSuscripcion(String id) {
		return suscripcionRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Suscripcion no encontrada"));
	}

	private Cliente obtenerCliente(String id) {
		if (id == null || id.isBlank()) {
			return Cliente.builder().razonSocial("Cliente no asociado").build();
		}
		return clienteRepository.findById(id)
				.orElse(Cliente.builder().razonSocial("Cliente no asociado").build());
	}

	private Servicio obtenerServicio(String id) {
		if (id == null || id.isBlank()) {
			return Servicio.builder().nombre("Plan no asociado").precioMensual(0.0).build();
		}
		return servicioRepository.findById(id)
				.orElse(Servicio.builder().nombre("Plan no asociado").precioMensual(0.0).build());
	}

	private Double valorSuscripcion(Suscripcion suscripcion, Servicio servicio) {
		return suscripcion.getPrecioActual() != null ? suscripcion.getPrecioActual() : servicio.getPrecioMensual();
	}

	private void celdaHeader(PdfPTable table, String text) {
		PdfPCell cell = baseCell(text, fuente(9, Font.BOLD, Color.WHITE));
		cell.setBackgroundColor(AZUL);
		table.addCell(cell);
	}

	private void celdaLabel(PdfPTable table, String text) {
		PdfPCell cell = baseCell(text, fuente(9, Font.BOLD, AZUL));
		cell.setBackgroundColor(GRIS_CLARO);
		table.addCell(cell);
	}

	private void celda(PdfPTable table, String text) {
		table.addCell(baseCell(text, fuente(9, Font.NORMAL, Color.DARK_GRAY)));
	}

	private void celdaDerecha(PdfPTable table, String text) {
		PdfPCell cell = baseCell(text, fuente(9, Font.NORMAL, Color.DARK_GRAY));
		cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
		table.addCell(cell);
	}

	private void celdaTotal(PdfPTable table, String text) {
		PdfPCell cell = baseCell(text, fuente(10, Font.BOLD, AZUL));
		cell.setBackgroundColor(GRIS_CLARO);
		table.addCell(cell);
	}

	private void celdaTotalDerecha(PdfPTable table, String text) {
		PdfPCell cell = baseCell(text, fuente(10, Font.BOLD, AZUL));
		cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
		cell.setBackgroundColor(GRIS_CLARO);
		table.addCell(cell);
	}

	private void celdaFirma(PdfPTable table, String label) {
		PdfPCell cell = new PdfPCell(new Phrase("\n\n______________________________\n" + label, fuente(9, Font.NORMAL, Color.DARK_GRAY)));
		cell.setBorder(Rectangle.NO_BORDER);
		cell.setHorizontalAlignment(Element.ALIGN_CENTER);
		cell.setPaddingTop(24);
		table.addCell(cell);
	}

	private PdfPCell baseCell(String text, Font font) {
		PdfPCell cell = new PdfPCell(new Phrase(texto(text), font));
		cell.setPadding(8);
		cell.setBorderColor(new Color(220, 230, 242));
		return cell;
	}

	private Font fuente(int size, int style, Color color) {
		return FontFactory.getFont(FontFactory.HELVETICA, size, style, color);
	}

	private String fecha(LocalDateTime fecha) {
		return fecha == null ? "-" : fecha.format(FECHA);
	}

	private String fechaHora(LocalDateTime fecha) {
		return fecha == null ? "-" : fecha.format(FECHA_HORA);
	}

	private String moneda(Double valor) {
		return "$" + String.format("%,.0f", valor == null ? 0.0 : valor);
	}

	private String texto(String valor) {
		return valor == null || valor.isBlank() ? "-" : valor;
	}

	@FunctionalInterface
	private interface DocumentWriter {
		void write(Document document) throws Exception;
	}
}
