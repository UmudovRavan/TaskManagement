using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class WorkGroupDetailAdd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_WorkGroup_WorkGroupId",
                table: "AspNetUsers");

            migrationBuilder.AlterColumn<string>(
                name: "LeaderId",
                table: "WorkGroup",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<int>(
                name: "AssignedWorkGroupId",
                table: "Tasks",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkGroup_LeaderId",
                table: "WorkGroup",
                column: "LeaderId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_AssignedWorkGroupId",
                table: "Tasks",
                column: "AssignedWorkGroupId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_WorkGroup_WorkGroupId",
                table: "AspNetUsers",
                column: "WorkGroupId",
                principalTable: "WorkGroup",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_WorkGroup_AssignedWorkGroupId",
                table: "Tasks",
                column: "AssignedWorkGroupId",
                principalTable: "WorkGroup",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkGroup_AspNetUsers_LeaderId",
                table: "WorkGroup",
                column: "LeaderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_WorkGroup_WorkGroupId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_WorkGroup_AssignedWorkGroupId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkGroup_AspNetUsers_LeaderId",
                table: "WorkGroup");

            migrationBuilder.DropIndex(
                name: "IX_WorkGroup_LeaderId",
                table: "WorkGroup");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_AssignedWorkGroupId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "AssignedWorkGroupId",
                table: "Tasks");

            migrationBuilder.AlterColumn<string>(
                name: "LeaderId",
                table: "WorkGroup",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_WorkGroup_WorkGroupId",
                table: "AspNetUsers",
                column: "WorkGroupId",
                principalTable: "WorkGroup",
                principalColumn: "Id");
        }
    }
}
