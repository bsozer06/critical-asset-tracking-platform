using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace CriticalAssetTracking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:postgis", ",,");

            migrationBuilder.CreateTable(
                name: "Geofences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Boundary = table.Column<Geometry>(type: "geometry(Polygon, 4326)", nullable: false),
                    AlertOnEntry = table.Column<bool>(type: "boolean", nullable: false),
                    AlertOnExit = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Geofences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GeofenceViolations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AssetId = table.Column<string>(type: "text", nullable: false),
                    GeofenceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ViolationType = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<Point>(type: "geometry(Point, 4326)", nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GeofenceViolations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GeofenceViolations_Geofences_GeofenceId",
                        column: x => x.GeofenceId,
                        principalTable: "Geofences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Geofences_Boundary",
                table: "Geofences",
                column: "Boundary")
                .Annotation("Npgsql:IndexMethod", "gist");

            migrationBuilder.CreateIndex(
                name: "IX_GeofenceViolations_GeofenceId",
                table: "GeofenceViolations",
                column: "GeofenceId");

            migrationBuilder.CreateIndex(
                name: "IX_GeofenceViolations_Location",
                table: "GeofenceViolations",
                column: "Location")
                .Annotation("Npgsql:IndexMethod", "gist");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GeofenceViolations");

            migrationBuilder.DropTable(
                name: "Geofences");
        }
    }
}
