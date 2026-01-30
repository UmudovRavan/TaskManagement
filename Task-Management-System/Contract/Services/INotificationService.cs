using Contract.DTOs;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Contract.Services
{
  
    public interface INotificationService
    {
        Task NotifyTaskAssignedAsync(string userId, string taskTitle, int taskId);

        Task RejectTaskNotificarionAsync(TaskActionDTO dto);
            Task<List<Notification>> GetMyNotificationsAsync(string userId);
            Task MarkReadAsync(int id);
            Task NotifyMentionsAsync(Dictionary<string, string> userMessages);
        Task AcceptTaskNotificationAsync(TaskActionDTO dto);
        Task NotifyUserAddedToWorkGroupAsync(string userId, string workGroupName);
        Task NotifyUserRemovedFromWorkGroupAsync(string userId, string workGroupName);
    }

}
