package com.innovation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.innovation")
public class InnovationTelecomunicacionesApplication {

	public static void main(String[] args) {
		SpringApplication.run(InnovationTelecomunicacionesApplication.class, args);
	}

}
