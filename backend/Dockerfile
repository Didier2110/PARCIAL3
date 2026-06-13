FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

COPY target\innovation-telecom-1.0.0.jar

EXPOSE 8210

ENV PORT=8210

ENTRYPOINT ["java", "-jar", "app.jar"]