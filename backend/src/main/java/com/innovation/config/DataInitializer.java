package com.innovation.config;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.innovation.entity.Cliente;
import com.innovation.entity.Factura;
import com.innovation.entity.Servicio;
import com.innovation.entity.Suscripcion;
import com.innovation.entity.Usuario;
import com.innovation.repository.ClienteRepository;
import com.innovation.repository.FacturaRepository;
import com.innovation.repository.ServicioRepository;
import com.innovation.repository.SuscripcionRepository;
import com.innovation.repository.TicketRepository;
import com.innovation.repository.UsuarioRepository;

@Component
public class DataInitializer {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ServicioRepository servicioRepository;

    @Autowired
    private SuscripcionRepository suscripcionRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    public void inicializarDatos() {
        try {
            ejecutarInicializacion();
        } catch (DataAccessException ex) {
            System.out.println("No se pudo conectar con MongoDB para inicializar datos: " + ex.getMessage());
            System.out.println("La aplicacion queda encendida. Revisa VPN/IP permitida en MongoDB Atlas y reinicia.");
        }
    }

    private void ejecutarInicializacion() {
        // Solo inicializar si no hay usuarios (evita borrar datos en reinicios)
        if (usuarioRepository.count() > 0) {
            aplicarAjustesMinimosEnDatosExistentes();
            System.out.println("✅ Base de datos ya inicializada. Omitiendo seed.");
            return;
        }

        // Crear usuario ADMIN
        Usuario admin = Usuario.builder()
                .nombre("Administrador")
                .apellido("Sistema")
                .email("admin@innovation.com")
                .contrasena(passwordEncoder.encode("Admin123*"))
                .rol("ADMIN")
                .estado("ACTIVO")
                .empresa("Innovation Telecomunicaciones S.A.S.")
                .telefono("3001234567")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(admin);

        // Crear usuario normal de prueba
        Usuario user = Usuario.builder()
                .nombre("Usuario")
                .apellido("Prueba")
                .email("usuario@innovation.com")
                .contrasena(passwordEncoder.encode("User123*"))
                .rol("CLIENTE")
                .estado("ACTIVO")
                .empresa("Innovation Telecomunicaciones S.A.S.")
                .telefono("3009876543")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(user);

        Usuario contable = Usuario.builder()
                .nombre("Laura")
                .apellido("Contable")
                .email("contable@innovation.com")
                .contrasena(passwordEncoder.encode("Cont123*"))
                .rol("CONTABLE")
                .estado("ACTIVO")
                .empresa("Innovation Telecomunicaciones S.A.S.")
                .telefono("3055556666")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(contable);

        // Crear vendedor de prueba
        Usuario vendedor = Usuario.builder()
                .nombre("Carlos")
                .apellido("Vendedor")
                .email("vendedor@innovation.com")
                .contrasena(passwordEncoder.encode("Vend123*"))
                .rol("VENDEDOR")
                .estado("ACTIVO")
                .empresa("Innovation Telecomunicaciones S.A.S.")
                .telefono("3011112222")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(vendedor);

        Usuario puntoVenta = Usuario.builder()
                .nombre("Punto")
                .apellido("Venta Aliado")
                .email("punto.venta@innovation.com")
                .contrasena(passwordEncoder.encode("Pva123*"))
                .rol("PUNTO_VENTA")
                .estado("ACTIVO")
                .empresa("Aliado Comercial Innovation")
                .telefono("3066667777")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(puntoVenta);

        // Crear jefe de bodega de prueba
        Usuario jefeBodega = Usuario.builder()
                .nombre("Luis")
                .apellido("Bodega")
                .email("bodega@innovation.com")
                .contrasena(passwordEncoder.encode("Bod123*"))
                .rol("JEFE_BODEGA")
                .estado("ACTIVO")
                .empresa("Innovation Telecomunicaciones S.A.S.")
                .telefono("3022223333")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(jefeBodega);

        // Crear jefe de cuadrilla / coordinador técnico
        Usuario jefeCuadrilla = Usuario.builder()
                .nombre("Andrés")
                .apellido("Cuadrilla")
                .email("cuadrilla@innovation.com")
                .contrasena(passwordEncoder.encode("Cuad123*"))
                .rol("JEFE_CUADRILLA")
                .estado("ACTIVO")
                .empresa("Innovation Telecomunicaciones S.A.S.")
                .telefono("3033334444")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(jefeCuadrilla);

        // Crear técnico de campo
        Usuario tecnico = Usuario.builder()
                .nombre("Pedro")
                .apellido("Técnico")
                .email("tecnico@innovation.com")
                .contrasena(passwordEncoder.encode("Tec123*"))
                .rol("TECNICO")
                .estado("ACTIVO")
                .empresa("Innovation Telecomunicaciones S.A.S.")
                .telefono("3044445555")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(tecnico);

        Usuario administrativo = Usuario.builder()
                .nombre("Marta")
                .apellido("Administrativa")
                .email("administrativo@innovation.com")
                .contrasena(passwordEncoder.encode("Adm123*"))
                .rol("ADMINISTRATIVO")
                .estado("ACTIVO")
                .empresa("Innovation Telecomunicaciones S.A.S.")
                .telefono("3077778888")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(administrativo);

        Usuario soporte = Usuario.builder()
                .nombre("Sofia")
                .apellido("Soporte")
                .email("soporte@innovation.com")
                .contrasena(passwordEncoder.encode("Sop123*"))
                .rol("SOPORTE")
                .estado("ACTIVO")
                .empresa("Innovation Telecomunicaciones S.A.S.")
                .telefono("3088889999")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(soporte);

        System.out.println("✅ Usuarios creados: 10 usuarios de prueba");

        // Crear servicios ISP de ejemplo
        Servicio plan50 = Servicio.builder()
                .nombre("Plan Hogar 50 Megas")
                .descripcion("Plan residencial de internet fibra óptica 50 Mbps simétrico")
                .tipo("FIBRA_OPTICA")
                .precioMensual(45000.0)
                .velocidad("50 Mbps")
                .limiteAncho(0)
                .estado("ACTIVO")
                .activo(true)
                .caracteristicas(List.of("Sin límite de descarga", "IP fija", "Soporte 24/7"))
                .fechaCreacion(LocalDateTime.now())
                .build();

        Servicio plan100 = Servicio.builder()
                .nombre("Plan Hogar 100 Megas")
                .descripcion("Plan residencial de internet fibra óptica 100 Mbps simétrico")
                .tipo("FIBRA_OPTICA")
                .precioMensual(75000.0)
                .velocidad("100 Mbps")
                .limiteAncho(0)
                .estado("ACTIVO")
                .activo(true)
                .caracteristicas(List.of("Sin límite de descarga", "IP fija", "Soporte 24/7", "Router Dual Band"))
                .fechaCreacion(LocalDateTime.now())
                .build();

        Servicio planEmpresa = Servicio.builder()
                .nombre("Plan Empresarial 300 Megas")
                .descripcion("Plan empresarial dedicado de 300 Mbps con SLA garantizado")
                .tipo("DEDICADO")
                .precioMensual(250000.0)
                .velocidad("300 Mbps")
                .limiteAncho(0)
                .estado("ACTIVO")
                .activo(true)
                .caracteristicas(List.of("Canal dedicado", "SLA 99.9%", "IP pública fija", "Soporte técnico prioritario", "Backup 4G LTE"))
                .fechaCreacion(LocalDateTime.now())
                .build();

        servicioRepository.saveAll(Arrays.asList(plan50, plan100, planEmpresa));
        System.out.println("✅ Servicios ISP creados: 3 planes");

        // Crear clientes de ejemplo
        Cliente cliente1 = Cliente.builder()
                .razonSocial("Empresa ABC S.A.S.")
                .documento("900123456-1")
                .tipoDocumento("NIT")
                .email("contacto@empresaabc.com")
                .telefono("6011234567")
                .direccion("Cra 15 # 93-47 Of 201")
                .ciudad("Bogotá")
                .departamento("Cundinamarca")
                .codigoPostal("110221")
                .estado("ACTIVO")
                .usuarioId(user.getId())
                .contactoPrincipal("Carlos Rodríguez")
                .telefonoContacto("3151234567")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();

        Cliente cliente2 = Cliente.builder()
                .razonSocial("Comercial XYZ Ltda.")
                .documento("800987654-2")
                .tipoDocumento("NIT")
                .email("admin@comercialxyz.com")
                .telefono("6044567890")
                .direccion("Calle 50 # 40-10 Piso 3")
                .ciudad("Medellín")
                .departamento("Antioquia")
                .codigoPostal("050021")
                .estado("ACTIVO")
                .contactoPrincipal("Ana García")
                .telefonoContacto("3209876543")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();

        Cliente cliente3 = Cliente.builder()
                .razonSocial("Servicios Tecnológicos del Valle")
                .documento("901234567-3")
                .tipoDocumento("NIT")
                .email("info@servatec.com")
                .telefono("6023456789")
                .direccion("Av. 6N # 23-45 Torre B")
                .ciudad("Cali")
                .departamento("Valle del Cauca")
                .codigoPostal("760001")
                .estado("ACTIVO")
                .contactoPrincipal("Luis Martínez")
                .telefonoContacto("3185551234")
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();

        clienteRepository.saveAll(Arrays.asList(cliente1, cliente2, cliente3));
        System.out.println("✅ Clientes creados: 3 clientes de ejemplo");

        Suscripcion suscripcionCliente = Suscripcion.builder()
                .clienteId(cliente1.getId())
                .servicioId(plan100.getId())
                .numeroContrato("CONT-CLIENTE-001")
                .estado("ACTIVA")
                .fechaInicio(LocalDateTime.now().minusMonths(2))
                .precioActual(75000.0)
                .metodoPago("TRANSFERENCIA")
                .proximoVencimiento(LocalDateTime.now().plusDays(8))
                .diasRestantes(8)
                .observaciones("Suscripción asociada al usuario cliente de prueba")
                .fechaCreacion(LocalDateTime.now())
                .activa(true)
                .build();
        suscripcionRepository.save(suscripcionCliente);

        Factura facturaPendiente = Factura.builder()
                .suscripcionId(suscripcionCliente.getId())
                .numeroFactura("FAC-CLIENTE-001")
                .estado("PENDIENTE")
                .fechaEmision(LocalDateTime.now().minusDays(22))
                .fechaVencimiento(LocalDateTime.now().plusDays(8))
                .subtotal(75000.0)
                .impuestos(14250.0)
                .total(89250.0)
                .metodoPago("TRANSFERENCIA")
                .fechaCreacion(LocalDateTime.now())
                .pagada(false)
                .build();
        facturaRepository.save(facturaPendiente);

        System.out.println("✅ Facturación de prueba creada para el cliente usuario@innovation.com");

        System.out.println("==============================================");
        System.out.println("🚀 Sistema listo. Credenciales de acceso:");
        System.out.println("   --- Empleados Innovation Telecomunicaciones S.A.S. ---");
        System.out.println("   Admin:          admin@innovation.com      / Admin123*");
        System.out.println("   Cliente:        usuario@innovation.com    / User123*");
        System.out.println("   Contable:       contable@innovation.com   / Cont123*");
        System.out.println("   Vendedor:       vendedor@innovation.com   / Vend123*");
        System.out.println("   Punto Venta:    punto.venta@innovation.com / Pva123*");
        System.out.println("   Jef.Bodega:     bodega@innovation.com     / Bod123*");
        System.out.println("   Jef.Cuadrilla:  cuadrilla@innovation.com  / Cuad123*");
        System.out.println("   Técnico:        tecnico@innovation.com    / Tec123*");
        System.out.println("   --- Clientes (empresas externas): 3 creados ---");
        System.out.println("==============================================");
    }

        private void aplicarAjustesMinimosEnDatosExistentes() {
                try {
                        asegurarUsuarioDemo("admin@innovation.com", "Administrador", "Sistema", "Admin123*", "ADMIN", "3001234567");
                        asegurarUsuarioDemo("usuario@innovation.com", "Usuario", "Prueba", "User123*", "CLIENTE", "3009876543");
                        asegurarUsuarioDemo("contable@innovation.com", "Laura", "Contable", "Cont123*", "CONTABLE", "3055556666");
                        asegurarUsuarioDemo("vendedor@innovation.com", "Carlos", "Vendedor", "Vend123*", "VENDEDOR", "3011112222");
                        asegurarUsuarioDemo("punto.venta@innovation.com", "Punto", "Venta Aliado", "Pva123*", "PUNTO_VENTA", "3066667777");
                        asegurarUsuarioDemo("bodega@innovation.com", "Luis", "Bodega", "Bod123*", "JEFE_BODEGA", "3022223333");
                        asegurarUsuarioDemo("cuadrilla@innovation.com", "Andres", "Cuadrilla", "Cuad123*", "JEFE_CUADRILLA", "3033334444");
                        asegurarUsuarioDemo("tecnico@innovation.com", "Pedro", "Tecnico", "Tec123*", "TECNICO", "3044445555");
                        asegurarUsuarioDemo("administrativo@innovation.com", "Marta", "Administrativa", "Adm123*", "ADMINISTRATIVO", "3077778888");
                        asegurarUsuarioDemo("soporte@innovation.com", "Sofia", "Soporte", "Sop123*", "SOPORTE", "3088889999");

                        Usuario usuarioCliente = usuarioRepository.findByEmail("usuario@innovation.com");
                        if (usuarioCliente == null) {
                                return;
                        }

                        Cliente clienteVinculado = clienteRepository.findByUsuarioId(usuarioCliente.getId())
                                        .stream()
                                        .findFirst()
                                        .orElse(null);

                        if (clienteVinculado == null) {
                                Cliente candidato = clienteRepository.findByActivo(true)
                                                .stream()
                                                .filter(c -> c.getUsuarioId() == null || c.getUsuarioId().isBlank())
                                                .findFirst()
                                                .orElse(null);

                                if (candidato != null) {
                                        candidato.setUsuarioId(usuarioCliente.getId());
                                        candidato.setFechaActualizacion(LocalDateTime.now());
                                        clienteVinculado = clienteRepository.save(candidato);
                                        System.out.println("✅ Ajuste: cliente vinculado al usuario de prueba CLIENTE");
                                }
                        }

                        if (clienteVinculado == null) {
                                return;
                        }

                        List<Suscripcion> suscripcionesCliente = suscripcionRepository.findByClienteId(clienteVinculado.getId());
                        if (suscripcionesCliente.isEmpty()) {
                                Servicio planBase = servicioRepository.findByActivo(true)
                                                .stream()
                                                .findFirst()
                                                .orElse(null);

                                if (planBase != null) {
                                        Suscripcion suscripcion = Suscripcion.builder()
                                                        .clienteId(clienteVinculado.getId())
                                                        .servicioId(planBase.getId())
                                                        .numeroContrato("CONT-AJUSTE-CLIENTE")
                                                        .estado("ACTIVA")
                                                        .fechaInicio(LocalDateTime.now().minusMonths(1))
                                                        .precioActual(planBase.getPrecioMensual())
                                                        .metodoPago("TRANSFERENCIA")
                                                        .proximoVencimiento(LocalDateTime.now().plusDays(7))
                                                        .diasRestantes(7)
                                                        .fechaCreacion(LocalDateTime.now())
                                                        .activa(true)
                                                        .build();
                                        suscripcion = suscripcionRepository.save(suscripcion);

                                        Factura factura = Factura.builder()
                                                        .suscripcionId(suscripcion.getId())
                                                        .numeroFactura("FAC-AJUSTE-CLIENTE")
                                                        .estado("PENDIENTE")
                                                        .fechaEmision(LocalDateTime.now().minusDays(20))
                                                        .fechaVencimiento(LocalDateTime.now().plusDays(7))
                                                        .subtotal(suscripcion.getPrecioActual())
                                                        .impuestos((suscripcion.getPrecioActual() != null ? suscripcion.getPrecioActual() : 0.0) * 0.19)
                                                        .total((suscripcion.getPrecioActual() != null ? suscripcion.getPrecioActual() : 0.0) * 1.19)
                                                        .metodoPago("TRANSFERENCIA")
                                                        .fechaCreacion(LocalDateTime.now())
                                                        .pagada(false)
                                                        .build();
                                        facturaRepository.save(factura);
                                        System.out.println("✅ Ajuste: suscripción/factura inicial creadas para cliente de prueba");
                                }
                        }
                } catch (Exception ex) {
                        System.out.println("⚠️ Ajuste automático omitido: " + ex.getMessage());
                }
        }

        private void asegurarUsuarioDemo(String email, String nombre, String apellido, String contrasena,
                        String rol, String telefono) {
                Usuario existente = usuarioRepository.findByEmail(email);
                if (existente != null) {
                        boolean actualizado = false;
                        if (!rol.equals(existente.getRol())) {
                                existente.setRol(rol);
                                actualizado = true;
                        }
                        if (existente.getActivo() == null || !existente.getActivo()) {
                                existente.setActivo(true);
                                actualizado = true;
                        }
                        if (!"ACTIVO".equals(existente.getEstado())) {
                                existente.setEstado("ACTIVO");
                                actualizado = true;
                        }
                        if (actualizado) {
                                existente.setFechaActualizacion(LocalDateTime.now());
                                usuarioRepository.save(existente);
                        }
                        return;
                }

                Usuario nuevo = Usuario.builder()
                                .nombre(nombre)
                                .apellido(apellido)
                                .email(email)
                                .contrasena(passwordEncoder.encode(contrasena))
                                .rol(rol)
                                .estado("ACTIVO")
                                .empresa("Innovation Telecomunicaciones S.A.S.")
                                .telefono(telefono)
                                .activo(true)
                                .fechaCreacion(LocalDateTime.now())
                                .build();
                usuarioRepository.save(nuevo);
                System.out.println("Usuario demo creado: " + email + " / " + rol);
        }
}
