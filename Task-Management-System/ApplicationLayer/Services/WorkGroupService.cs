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
using System.Reactive;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services
{
    public class WorkGroupService : IWorkGroupService
    {
        private readonly IGenericService<WorkGroupDTO, WorkGroup> _groupWorkservice;



        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IGenericService<TaskDTO, TaskItem> _genericService;
        private readonly INotificationService _notification;
        private readonly IGenericRepository<TaskTransaction> _transaction;

        public WorkGroupService(IGenericService<WorkGroupDTO, WorkGroup> groupWorkservice, UserManager<ApplicationUser> userManager, IGenericService<TaskDTO, TaskItem> genericService, INotificationService notification, IGenericRepository<TaskTransaction> transaction)
        {
            _groupWorkservice = groupWorkservice;
            _userManager = userManager;
            _genericService = genericService;
            _notification = notification;
            _transaction = transaction;
        }

        public async Task<IEnumerable<WorkGroupDTO>> GetAllWorkGroupsAsync()
        {


            var data = await _groupWorkservice.GetAllAsync(q => q
                .Include(w => w.Leader)   
                .Include(w => w.Users)  
            );

            return data;
        }

        public async Task<WorkGroupDTO> GetWorkGroupByIdAsync(int id)
        {
            var workGroups = await _groupWorkservice.GetAllAsync(q => q
                .Include(w => w.Leader)
                .Include(w => w.Users)
                .Where(w => w.Id == id)
            );
            return workGroups.FirstOrDefault();
        }
        public async Task<WorkGroupDTO> CreateWorkGroupAsync(WorkGroupDTO workGroup)
        {
            await _groupWorkservice.AddAsync(workGroup);
            return workGroup;
        }
        public async Task UpdateWorkGroupAsync(WorkGroupDTO workGroup)
        {
            await _groupWorkservice.UpdateAsync(workGroup);

        }
        public async Task DeleteWorkGroupAsync(int id)
        {
            if (await _groupWorkservice.GetByIdAsync(id) is not null)
            {
                await _groupWorkservice.DeleteAsync(id);
            }

        }
        public async Task<WorkGroupDTO> GetWorkGroupByLeaderIdAsync(string leaderId)
        {

            var workGroup = await _groupWorkservice.GetAllAsync(q => q
                .Include(w => w.Leader)

                .Where(w => w.LeaderId == leaderId)
            );


            return workGroup.FirstOrDefault();
        }


        public async Task AssignTaskToGroupAsync(int taskId, string leaderId, int targetWorkGroupId)
        {

            var currentGroup = await GetWorkGroupByLeaderIdAsync(leaderId);
            if (currentGroup == null)
                throw new Exception("User is not a leader of any work group.");

            var targetWorkGroup = await _groupWorkservice.GetByIdAsync(targetWorkGroupId);
            var task = await _genericService.GetByIdAsync(taskId);
            if (task == null)
                throw new Exception("Task not found.");


            if (task.WorkGroupId != currentGroup.Id)
                throw new Exception("Task does not belong to the leader's work group.");


            var newGroup = await _groupWorkservice.GetByIdAsync(targetWorkGroupId);
            if (newGroup == null)
                throw new Exception("Target work group does not exist.");


            var dto = new TaskDTO
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                WorkGroupId = targetWorkGroupId,
                CreatedByUserId = task.CreatedByUserId,
                Deadline = task.Deadline,
                Status = CurrentSituation.Assigned,
                Difficulty = task.Difficulty,
                TaskCommentId = task.TaskCommentId
            };

            await _genericService.UpdateAsync(dto);


            await _transaction.AddAsync(new TaskTransaction
            {
                TaskItemId = task.Id,
                FromUserId = currentGroup.Id.ToString(),
                ToUserId = targetWorkGroupId.ToString(),
                Comments = $"Task assigned from {currentGroup.Name} to {targetWorkGroup.Name} "
            });



            await _notification.NotifyTaskAssignedAsync(targetWorkGroup.LeaderId, task.Title, taskId);

        }
        public async Task AddUserToWorkGroupAsync(int workGroupId, string userId)
        {

            var workGroup = await _groupWorkservice.GetByIdAsync(workGroupId);
            if (workGroup == null)
                throw new Exception("Work group not found.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new Exception("User not found.");

            workGroup.UserIds ??= new List<string>();

            if (workGroup.UserIds.Any(u => u == userId))
                throw new Exception("User is already a member of the work group.");

            workGroup.UserIds.Add(user.Id);

            user.WorkGroupId = workGroupId;

            await _userManager.UpdateAsync(user);
            await _groupWorkservice.UpdateAsync(workGroup);
            await _notification.NotifyUserAddedToWorkGroupAsync(userId, workGroup.Name);
        }
        public async Task RemoveUserFromWorkGroupAsync(int workGroupId, string userId)
        {
            var workGroup = await _groupWorkservice.GetByIdAsync(workGroupId);
            if (workGroup == null)
                throw new Exception("Work group not found.");
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new Exception("User not found.");
            if (workGroup.UserIds == null || !workGroup.UserIds.Any(u => u == userId))
                throw new Exception("User is not a member of the work group.");
            workGroup.UserIds.Remove(user.Id);
            user.WorkGroupId = null;
            await _userManager.UpdateAsync(user);
            await _groupWorkservice.UpdateAsync(workGroup);
            await _notification.NotifyUserRemovedFromWorkGroupAsync(userId, workGroup.Name);
        }

    }
}
