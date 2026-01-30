using Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Reflection.Emit;
using System.Text;

namespace Persistence.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

      public  DbSet<TaskItem> Tasks { get; set; }
      public   DbSet<TaskTransaction> TaskTransactions { get; set; }
      public   DbSet<TaskComment> TaskComments { get; set; }
      public   DbSet<TaskCommentMention> TaskCommentMentions { get; set; }
      public   DbSet<PerformancePoint> PerformancePoints { get; set; }
      public   DbSet<Notification> Notifications { get; set; }
      public DbSet<PasswordResetOTP> PasswordResetOtps { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ================= TaskItem =================
            modelBuilder.Entity<TaskItem>(entity =>
            {
                // AssignedToUser ↔ ApplicationUser.AssignedTasks
                entity.HasOne(t => t.AssignedToUser)
                      .WithMany(u => u.AssignedTasks)
                      .HasForeignKey(t => t.AssignedToUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                // CreatedByUser ↔ ApplicationUser.CreatedTasks
                entity.HasOne(t => t.CreatedByUser)
                      .WithMany(u => u.CreatedTasks)
                      .HasForeignKey(t => t.CreatedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                // ParentTask optional self-reference
                entity.HasOne<TaskItem>()
                      .WithMany()
                      .HasForeignKey(t => t.ParentTaskId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ================= TaskComment =================
            modelBuilder.Entity<TaskComment>(entity =>
            {
                entity.HasOne(c => c.TaskItem)
                      .WithMany(t => t.TaskComments)
                      .HasForeignKey(c => c.TaskId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(c => c.User)
                      .WithMany(u => u.TaskComments)
                      .HasForeignKey(c => c.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ================= TaskCommentMention =================
            modelBuilder.Entity<TaskCommentMention>(entity =>
            {
                entity.HasOne(m => m.TaskComment)
                      .WithMany(c => c.TaskCommentMentions)
                      .HasForeignKey(m => m.CommentId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.MentionedUser)
                      .WithMany(u => u.TaskCommentMentions)
                      .HasForeignKey(m => m.MentionedUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ================= TaskTransaction =================
            modelBuilder.Entity<TaskTransaction>(entity =>
            {
                entity.HasOne(t => t.TaskItem)
                      .WithMany()
                      .HasForeignKey(t => t.TaskItemId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.FromUser)
                      .WithMany()
                      .HasForeignKey(t => t.FromUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.ToUser)
                      .WithMany()
                      .HasForeignKey(t => t.ToUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ================= PerformancePoint =================
            modelBuilder.Entity<PerformancePoint>(entity =>
            {
                entity.HasOne(p => p.User)
                      .WithMany(u => u.PerformancePoints)
                      .HasForeignKey(p => p.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ================= Notification =================
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasOne(n => n.User)
                      .WithMany(u => u.Notifications)
                      .HasForeignKey(n => n.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ================= PasswordResetOTP =================
            modelBuilder.Entity<PasswordResetOTP>(entity =>
            {
                entity.HasOne(p => p.User)
                      .WithMany()
                      .HasForeignKey(p => p.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });


            // 1️⃣ WorkGroup → Users (member-lər)
            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.WorkGroup)
                .WithMany(w => w.Users)
                .HasForeignKey(u => u.WorkGroupId)
                .OnDelete(DeleteBehavior.SetNull);

            // 2️⃣ WorkGroup → Leader (1 leader)
            modelBuilder.Entity<WorkGroup>()
                .HasOne(w => w.Leader)
                .WithMany() // Leader üçün collection YOXDUR
                .HasForeignKey(w => w.LeaderId)
                .OnDelete(DeleteBehavior.Restrict);
        }

    }
}

