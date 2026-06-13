package com.innovation.util;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class DateUtils {

	public static Integer calcularDiasRestantes(LocalDateTime fechaFin) {
		if (fechaFin == null) {
			return null;
		}
		long dias = ChronoUnit.DAYS.between(LocalDateTime.now(), fechaFin);
		return (int) dias;
	}

	public static Integer calcularMinutosTranscurridos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
		if (fechaInicio == null || fechaFin == null) {
			return null;
		}
		long minutos = ChronoUnit.MINUTES.between(fechaInicio, fechaFin);
		return (int) minutos;
	}

	public static Boolean estaVencido(LocalDateTime fechaVencimiento) {
		if (fechaVencimiento == null) {
			return false;
		}
		return LocalDateTime.now().isAfter(fechaVencimiento);
	}

	public static String formatearFecha(LocalDateTime fecha) {
		if (fecha == null) {
			return "";
		}
		return fecha.toString();
	}
}
