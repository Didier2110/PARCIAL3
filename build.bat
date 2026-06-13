@echo off
REM Script de construcción para Windows

echo === Innovation Telecomunicaciones ISP ===
echo Iniciando construcción...

cd backend

echo Limpiando proyecto anterior...
call mvnw.cmd clean

echo Compilando y empaquetando...
call mvnw.cmd package -DskipTests

echo Construcción completada
echo JAR generado en: target\innovation-telecom-1.0.0.jar

echo.
echo Para iniciar la aplicación, ejecutar:
echo java -jar target\innovation-telecom-1.0.0.jar
