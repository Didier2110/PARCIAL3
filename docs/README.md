# Innovation Telecomunicaciones ISP

## Sistema Integral de Gestión de Servicios ISP

Plataforma completa para la gestión de servicios de internet, clientes, suscripciones, facturas y tickets de soporte.

### Características

- ✅ Autenticación con JWT
- ✅ Gestión de Usuarios
- ✅ Catálogo de Servicios
- ✅ Gestión de Clientes
- ✅ Administración de Suscripciones
- ✅ Sistema de Facturación
- ✅ Gestión de Tickets de Soporte
- ✅ API REST completa
- ✅ Documentación con Swagger/OpenAPI
- ✅ Base de datos MongoDB
- ✅ Frontend responsivo
- ✅ Seguridad con Spring Security

### Requisitos

- Java 17 o superior
- Maven 3.8+
- MongoDB 5.0+
- Node.js (opcional, para herramientas frontend)

### Instalación

#### Backend

1. Clonar o descargar el proyecto
2. Navegar a la carpeta `backend`
3. Asegurar que MongoDB está ejecutándose
4. Compilar el proyecto:

```bash
mvn clean install
```

5. Ejecutar la aplicación:

```bash
mvn spring-boot:run
```

La API estará disponible en `http://localhost:8080`

#### Frontend

1. Abrir los archivos HTML directamente en un navegador o servir con un servidor web
2. Los archivos se encuentran en la carpeta `frontend/html`

### Estructura del Proyecto

```
Innovation-Telecomunicaciones-ISP/
├── backend/
│   ├── src/main/java/com/innovation/
│   │   ├── config/           # Configuración de seguridad, Swagger
│   │   ├── controller/       # Controladores REST
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── entity/          # Entidades MongoDB
│   │   ├── exception/       # Excepciones personalizadas
│   │   ├── jwt/             # Gestión de JWT
│   │   ├── mapper/          # Mapeo de datos
│   │   ├── repository/      # Repositorios MongoDB
│   │   ├── security/        # Configuración de seguridad
│   │   ├── service/         # Servicios de negocio
│   │   └── util/            # Utilidades
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── pom.xml
│   └── mvnw
├── frontend/
│   ├── html/                # Páginas HTML
│   ├── css/                 # Estilos CSS
│   ├── js/                  # Scripts JavaScript
│   ├── pages/               # Páginas adicionales
│   └── assets/              # Recursos
├── docs/
│   ├── swagger/             # Documentación Swagger
│   ├── postman/             # Colecciones Postman
│   └── README.md
└── docker/
    └── Dockerfile
```

### Endpoints de la API

#### Autenticación

- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/registro` - Registrarse

#### Usuarios

- `POST /api/v1/usuarios` - Crear usuario
- `GET /api/v1/usuarios` - Obtener todos los usuarios
- `GET /api/v1/usuarios/{id}` - Obtener usuario por ID
- `PUT /api/v1/usuarios/{id}` - Actualizar usuario
- `DELETE /api/v1/usuarios/{id}` - Eliminar usuario

#### Clientes

- `POST /api/v1/clientes` - Crear cliente
- `GET /api/v1/clientes` - Obtener todos los clientes
- `GET /api/v1/clientes/{id}` - Obtener cliente por ID
- `PUT /api/v1/clientes/{id}` - Actualizar cliente
- `DELETE /api/v1/clientes/{id}` - Eliminar cliente

#### Servicios

- `POST /api/v1/servicios` - Crear servicio
- `GET /api/v1/servicios` - Obtener todos los servicios
- `GET /api/v1/servicios/{id}` - Obtener servicio por ID
- `PUT /api/v1/servicios/{id}` - Actualizar servicio
- `DELETE /api/v1/servicios/{id}` - Eliminar servicio

#### Suscripciones

- `POST /api/v1/suscripciones` - Crear suscripción
- `GET /api/v1/suscripciones` - Obtener todas las suscripciones
- `GET /api/v1/suscripciones/{id}` - Obtener suscripción por ID
- `PUT /api/v1/suscripciones/{id}` - Actualizar suscripción
- `DELETE /api/v1/suscripciones/{id}` - Cancelar suscripción

#### Facturas

- `POST /api/v1/facturas` - Crear factura
- `GET /api/v1/facturas` - Obtener todas las facturas
- `GET /api/v1/facturas/{id}` - Obtener factura por ID
- `POST /api/v1/facturas/{id}/marcar-pagada` - Marcar factura como pagada

#### Tickets

- `POST /api/v1/tickets` - Crear ticket
- `GET /api/v1/tickets` - Obtener todos los tickets
- `GET /api/v1/tickets/{id}` - Obtener ticket por ID
- `PUT /api/v1/tickets/{id}` - Actualizar ticket
- `POST /api/v1/tickets/{id}/resolver` - Resolver ticket
- `DELETE /api/v1/tickets/{id}` - Cerrar ticket

### Documentación API

La documentación interactiva de la API está disponible en:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

### Autenticación

Para usar los endpoints protegidos, incluir el token JWT en el header:

```
Authorization: Bearer <token>
```

### Configuración

Editar `backend/src/main/resources/application.properties` para configurar:

- Puerto del servidor (por defecto 8080)
- URI de MongoDB
- Base de datos MongoDB
- JWT secret y expiración
- Niveles de logging

### Ejemplos de Uso

#### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","contrasena":"password"}'
```

#### Crear Cliente

```bash
curl -X POST http://localhost:8080/api/v1/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "razonSocial":"Empresa Test",
    "documento":"123456789",
    "email":"cliente@example.com",
    "telefono":"1234567890",
    "ciudad":"Bogotá"
  }'
```

### Contribución

El proyecto está completamente funcional y compilable. Para modificaciones:

1. Seguir la estructura de capas (controller > service > repository)
2. Mantener la consistencia en nombres y estilos de código
3. Actualizar la documentación según cambios

### Soporte

Para reportar bugs o solicitar features, contactar al equipo de desarrollo.

### Licencia

© 2026 Innovation Telecomunicaciones S.A.S. Todos los derechos reservados.
