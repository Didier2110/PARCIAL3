#!/bin/bash

# Script de construcción del proyecto

echo "=== Innovation Telecomunicaciones ISP ==="
echo "Iniciando construcción..."

cd backend

echo "Limpiando proyecto anterior..."
mvn clean

echo "Compilando y empaquetando..."
mvn package -DskipTests

echo "Construcción completada"
echo "JAR generado en: target/innovation-telecom-1.0.0.jar"

echo ""
echo "Para iniciar la aplicación, ejecutar:"
echo "java -jar target/innovation-telecom-1.0.0.jar"
