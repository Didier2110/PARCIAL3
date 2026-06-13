package com.innovation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDTO {

	private String id;
	private String token;
	private String tipo;
	private String email;
	private String nombre;
	private String rol;
	private Long expiresIn;
}
