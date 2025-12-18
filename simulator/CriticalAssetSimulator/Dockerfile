# Build simulator (multi-stage) to run within Docker Compose
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY *.csproj ./
RUN dotnet restore CriticalAssetSimulator.csproj

# Copy everything and publish
COPY . .
RUN dotnet publish CriticalAssetSimulator.csproj -c Release -o /app/publish

# Build runtime image
FROM mcr.microsoft.com/dotnet/runtime:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./
ENTRYPOINT ["dotnet", "CriticalAssetSimulator.dll"]
