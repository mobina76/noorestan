using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Noorestan.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class BusinessProfilePhonesJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Phone",
                table: "BusinessProfiles");

            migrationBuilder.AddColumn<string>(
                name: "Phones",
                table: "BusinessProfiles",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Phones",
                table: "BusinessProfiles");

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "BusinessProfiles",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
