using Contract.DTOs;
using Contract.Services;
using Domain.Entities;
using Domain.Enums;
using Domain.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Application.Services
{
    public class TaskService : ITaksService

    {
        private readonly IGenericService<TaskDTO,TaskItem> _genericService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IGenericService<TaskCommentDTO, TaskComment> _taskCommentService;
        private readonly IGenericRepository<TaskCommentMention> _commentMentionRepo;
        private readonly IGenericRepository<Notification> _notificationRepo;
        private readonly INotificationService _notification;
        private readonly IGenericRepository<TaskTransaction> _transaction;
        private readonly IUnityOfWork _unityOfWork;
        public TaskService(IGenericService<TaskDTO, TaskItem> genericService, UserManager<ApplicationUser> userManager, IGenericService<TaskCommentDTO, TaskComment> taskCommentService, IGenericRepository<TaskCommentMention> commentMentionRepo, INotificationService notification, IGenericRepository<Notification> notificationRepo, IGenericRepository<TaskTransaction> transaction, IUnityOfWork unityOfWork)
        {
            _genericService = genericService;
            _userManager = userManager;
            _taskCommentService = taskCommentService;
            _commentMentionRepo = commentMentionRepo;
            _notification = notification;
            _notificationRepo = notificationRepo;
            _transaction = transaction;
            _unityOfWork = unityOfWork;
        }

       
        public async Task AddComment(int taskId, string userId, string comment)
        {
            var task = await _genericService.GetByIdAsync(taskId);
            if (task == null)
                throw new Exception("Task not found");

            var mentionedUsernames = Regex.Matches(comment, @"@(\w+)")
                .Select(m => m.Groups[1].Value)
                .Distinct()
                .ToList();

            var mentionedUserIds = new List<string>();
            if (mentionedUsernames.Any())
            {
                mentionedUserIds = await _userManager.Users
                    .Where(u => mentionedUsernames.Contains(u.UserName))
                    .Select(u => u.Id)
                    .ToListAsync();
            }

            var taskCommentDto = new TaskCommentDTO
            {
                TaskId = taskId,
                UserId = userId,
                Content = comment,
                TaskCommentMentionIDs = mentionedUserIds
            };
            var commentEntity = await _taskCommentService.AddAsync(taskCommentDto);

            foreach (var mentionedUserId in mentionedUserIds)
            {
                if (mentionedUserId == userId) continue;

                var mention = new TaskCommentMention
                {
                    CommentId = commentEntity.Id,
                    MentionedUserId = mentionedUserId
                };
                await _commentMentionRepo.AddAsync(mention);
            }

            var userMessages = new Dictionary<string, string>();
            foreach (var mentionedUserId in mentionedUserIds)
            {
                if (mentionedUserId == userId) continue;

           
                var message = $"{task.Title} taskına mention edildin: {comment}";
                userMessages.Add(mentionedUserId, message);
            }

           
            await _notification.NotifyMentionsAsync(userMessages);
        }

      
        public async Task   AcceptTask(int taskId , string userId)
        {
            var task = await _genericService.GetByIdAsync(taskId);
            if (task == null)
                throw new Exception("Task not found");
            if (task.AssignedToUserId != userId)
                throw new Exception("You are not assigned to this task.");
            var DTO = new TaskDTO
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                AssignedToUserId = task.AssignedToUserId,
                CreatedByUserId = task.CreatedByUserId,
                Deadline = task.Deadline,
                Difficulty = task.Difficulty,
                Status = CurrentSituation.InProgress,
                TaskCommentId = task.TaskCommentId,
            };
            await _genericService.UpdateAsync(DTO);
            await _transaction.AddAsync(new TaskTransaction
            {
                TaskItemId = task.Id,
                FromUserId = task.CreatedByUserId,
                ToUserId = userId,
                Comments = "Task accepted"
            });

            await _notification.AcceptTaskNotificationAsync(new TaskActionDTO { userId = task.CreatedByUserId, accepterId = task.AssignedToUserId, TaskTitle = task.Title });
            await _unityOfWork.SaveChangesAsync();



        }

        public async Task RejectTask(int taskId, string userId, string reason)
        {
            var task = await _genericService.GetByIdAsync(taskId);
            if (task == null)
                throw new Exception("Task not found");
            if (task.AssignedToUserId != userId)
                throw new Exception("You are not assigned to this task.");
            var DTO = new TaskDTO
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                AssignedToUserId = null,
                CreatedByUserId = task.CreatedByUserId,
                Deadline = task.Deadline,
                Difficulty = task.Difficulty,
                Status = CurrentSituation.Assigned,
                TaskCommentId = task.TaskCommentId,
            };
            await _genericService.UpdateAsync(DTO);
            await _transaction.AddAsync(new TaskTransaction
            {
                TaskItemId = task.Id,
                FromUserId = task.CreatedByUserId,
                ToUserId = userId,
                Comments = $"Task rejected: {reason}"
            });
            await _notification.RejectTaskNotificarionAsync(new TaskActionDTO { userId=task.CreatedByUserId, accepterId=task.AssignedToUserId, TaskTitle=task.Title});
            await _unityOfWork.SaveChangesAsync();
        }




        public async Task AssignTaskAsync(int taskId, string userId)
        {
          var task = await  _genericService.GetByIdAsync(taskId);
            if (task == null)
                throw new Exception("Task not found");
            if(task.CreatedByUserId== userId)
              throw new Exception("You cannot assign the task to yourself.");
            var DTO= new TaskDTO
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                AssignedToUserId = userId,
                CreatedByUserId= task.CreatedByUserId,
                Deadline = task.Deadline,
                Status= CurrentSituation.Assigned,
                Difficulty = task.Difficulty,
               TaskCommentId = task.TaskCommentId,
               
            };

            await _genericService.UpdateAsync(DTO);
            await _transaction.AddAsync(new TaskTransaction
            {
                TaskItemId = task.Id,
                FromUserId = task.CreatedByUserId,
                ToUserId = userId,
                Comments = "Task assigned"

            });

            await _notification.NotifyTaskAssignedAsync(userId, task.Title ,taskId);
        }

        public async Task UnAssingTaskAsync(int taskId, string userId)
        {
           var task = await _genericService.GetByIdAsync(taskId);
            if(task.CreatedByUserId != userId)
                throw new Exception("Only the creator can unassign the task.");

            if (task == null)
                throw new Exception("Task not found");
            var DTO = new TaskDTO
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                AssignedToUserId = null,
                CreatedByUserId = task.CreatedByUserId,
                Deadline = task.Deadline,
                Difficulty = task.Difficulty,
                TaskCommentId = task.TaskCommentId,
            };
            await _transaction.AddAsync(new TaskTransaction
            {
                TaskItemId = task.Id,
                FromUserId = userId,
                ToUserId = task.CreatedByUserId,
                Comments = "Task unassigned"
            });

            await _genericService.UpdateAsync(DTO);

        }
    }
}
