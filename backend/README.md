# Backend — Dockerized setup

This folder contains the ASP.NET Core backend (SignalR) for the Critical Asset Tracking Platform.

Quick start (Docker Compose)

1) Build and run the backend and RabbitMQ locally:

```bash
cd backend
docker compose up --build
```

2) The API is available at http://localhost:5073 and the RabbitMQ management UI at http://localhost:15672 (user: `rabbitmq`, password: `rabbitmq`).

Using the local RabbitMQ image
- The docker compose RabbitMQ image replaces CloudAMQP for local development. It is configured with default credentials `rabbitmq`/`rabbitmq` and port `5672`.
- `appsettings.Development.json` is updated to use the local RabbitMQ defaults for comfortable local development. If you run the API in Docker Compose, environment variables in `docker-compose.yml` will override these values.

Notes
- `Api/Dockerfile` is a multi-stage Dockerfile that builds and publishes the API.
- `docker-compose.yml` starts a RabbitMQ service and the API and injects RabbitMQ environment variables.
- The API will bind to `http://+:80` inside the container; compose maps host port 5073 to container port 80.   
- RabbitMQ Management UI:
- Management UI: http://localhost:15672
- User: rabbitmq
- Password: rabbitmq

Environment overrides
- To point the API to a cloud RabbitMQ, remove the `RabbitMq__*` environment overrides in the compose file and update `appsettings.*.json` accordingly.

Simulator (Docker Compose)
- A simulator service is included in `docker-compose.yml` for local testing. It uses the `simulator/CriticalAssetSimulator/Dockerfile` and is configured to connect to the `rabbitmq` service on the same compose network.
- The simulator `config.json` defaults are set to use `rabbitmq:5672` and credentials `rabbitmq`/`rabbitmq` for local development.
