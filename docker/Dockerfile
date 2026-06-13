FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

COPY target/futbolclub-1.0.0.jar app.jar

EXPOSE 8210

ENV PORT=8210

ENTRYPOINT ["java", "-jar", "app.jar"]