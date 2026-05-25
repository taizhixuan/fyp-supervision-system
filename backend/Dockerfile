FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN mkdir -p /app/uploads && chmod +x /app/docker-entrypoint.sh
EXPOSE 8080 8081
ENTRYPOINT ["/app/docker-entrypoint.sh"]
