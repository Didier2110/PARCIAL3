package com.innovation.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;

@Configuration
public class SwaggerConfig {

	@Bean
	public OpenAPI customOpenAPI() {
		return new OpenAPI()
				.info(new Info()
						.title("Innovation Telecomunicaciones ISP API")
						.version("1.0.0")
						.description("Sistema Integral de Gestión de Servicios ISP - API REST")
						.contact(new Contact()
								.name("Innovation Telecomunicaciones")
								.email("info@innovation.com")
								.url("https://www.innovation.com")));
	}
}
