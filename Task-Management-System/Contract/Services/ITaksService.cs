using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Contract.Services
{
    public interface ITaksService
    {
        public Task AddComment(int taskId, string userId, string comment);
        public Task UnAssingTaskAsync(int taskId, string userId);
        public Task AssignTaskAsync(int taskId, string userId);
        Task AcceptTask(int taskId, string userId);
        Task RejectTask(int taskId, string userId, string reason);


    }
}
