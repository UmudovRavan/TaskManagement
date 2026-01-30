using Contract.DTOs;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Contract.Services
{
    public  interface IWorkGroupService
    {
        Task AssignTaskToGroupAsync(int taskId, string leaderId, int targetWorkGroupId);
        Task<WorkGroupDTO> GetWorkGroupByLeaderIdAsync(string leaderId);
        Task DeleteWorkGroupAsync(int id);
        Task UpdateWorkGroupAsync(WorkGroupDTO workGroup);
        Task<WorkGroupDTO> CreateWorkGroupAsync(WorkGroupDTO workGroup);
        Task<WorkGroupDTO> GetWorkGroupByIdAsync(int id);
        Task<IEnumerable<WorkGroupDTO>> GetAllWorkGroupsAsync();
        Task AddUserToWorkGroupAsync(int workGroupId, string userId);
        Task RemoveUserFromWorkGroupAsync(int workGroupId, string userId);


    }
}
