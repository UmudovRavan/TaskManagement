using Contract.DTOs;
using Contract.Services;
using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Presentation.Hubs;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repository;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly UserManager<ApplicationUser> _userManager;
    public NotificationService(INotificationRepository repository, IHubContext<NotificationHub> hub, UserManager<ApplicationUser> userManager)
    {
        _repository = repository;
        _hub = hub;
        _userManager = userManager;
    }

    public async Task NotifyTaskAssignedAsync(string userId, string taskTitle, int taskId)
    {
        var message = $"Yeni task: {taskTitle} təyin olundu";

        var notification = new Notification
        {
            UserId = userId,
            Message = message,
            TaskId = taskId,
            IsRead = false,
            CreateAt = DateTime.UtcNow
        };

        await _repository.AddAsync(notification);

        await _hub.Clients.User(userId)
            .SendAsync("ReceiveNotification", new
            {
                message,
                taskId
            });
    }


    public async Task NotifyMentionsAsync(Dictionary<string, string> userMessages)
    {
        if (userMessages == null || !userMessages.Any()) return;

        var notifications = userMessages
            .Select(kv => new Notification
            {
                UserId = kv.Key,
                Message = kv.Value,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            })
            .ToList();

        await _repository.AddRangeAsync(notifications);
       
        var tasks = userMessages
            .Select(kv =>
            {
                var userId = kv.Key.ToLower();
                return _hub.Clients.User(userId).SendAsync("ReceiveNotification", kv.Value);
            })
            .ToList();

        await Task.WhenAll(tasks);
    }


    public async Task<List<Notification>> GetMyNotificationsAsync(string userId)
    {
        return await _repository.GetUserNotificationsAsync(userId);
    }

    public async Task MarkReadAsync(int id)
    {
        await _repository.MarkAsReadAsync(id);
    }

    public async Task AcceptTaskNotificationAsync(TaskActionDTO task)
    {
        var userName= _userManager.Users.FirstOrDefault(u=>u.Id==task.accepterId)?.UserName;

        var message = $"{userName} {task.TaskTitle} tapşırığını qəbul etdi";
        await _repository.AddAsync(new Notification
        {
            UserId = task.accepterId,
            Message = message,
            IsRead = false,
            CreateAt = DateTime.UtcNow
        });
        
        await _hub.Clients.User(task.userId).SendAsync("ReceiveNotification", message);
    }

    public async Task RejectTaskNotificarionAsync(TaskActionDTO task)
    {
        var userName = _userManager.Users.FirstOrDefault(u => u.Id == task.accepterId)?.UserName;
        var message = $"{userName} {task.TaskTitle} tapşırığını rədd etdi";
        await _repository.AddAsync(new Notification
        {
            UserId = task.accepterId,
            Message = message,
            IsRead = false,
            CreateAt = DateTime.UtcNow
        });
        await _hub.Clients.User(task.userId).SendAsync("ReceiveNotification", message);

    }

    public async Task NotifyUserAddedToWorkGroupAsync(string userId, string workGroupName)
    {
        var message = $"{workGroupName} iş qrupuna əlavə olundunuz";
        var notification = new Notification
        {
            UserId = userId,
            Message = message,
            IsRead = false,
            CreateAt = DateTime.UtcNow
        };
        await _repository.AddAsync(notification);
        await _hub.Clients.User(userId)
            .SendAsync("ReceiveNotification", message);
    }
    public async Task NotifyUserRemovedFromWorkGroupAsync(string userId, string workGroupName)
    {
        var message = $"{workGroupName} iş qrupundan çıxarıldınız";
        var notification = new Notification
        {
            UserId = userId,
            Message = message,
            IsRead = false,
            CreateAt = DateTime.UtcNow
        };
        await _repository.AddAsync(notification);
        await _hub.Clients.User(userId)
            .SendAsync("ReceiveNotification", message);
    }
}
