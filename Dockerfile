#Stage 1 Build
FROM gradle:9.0-jdk21 AS builder
WORKDIR /app
COPY . .
RUN gradle bootJar --no-daemon
#Stage 2 RUN
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar","app.jar"]