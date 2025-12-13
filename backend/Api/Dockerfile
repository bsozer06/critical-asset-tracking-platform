# Build and publish the ASP.NET Core API (multi-stage)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY CriticalAssetTracking.sln ./
COPY Api/*.csproj ./Api/
COPY Application/*.csproj ./Application/
COPY Infrastructure/*.csproj ./Infrastructure/
COPY Domain/*.csproj ./Domain/
RUN dotnet restore

# Copy everything and build
COPY . .
RUN dotnet publish Api/CriticalAssetTracking.Api.csproj -c Release -o /app/publish /p:PublishTrimmed=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
COPY --from=build /app/publish ./
ENTRYPOINT ["dotnet", "CriticalAssetTracking.Api.dll"]
