using Contract.DTOs;
using Contract.Services;
using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services
{
    public class PerformanceService : IPerformanceService
    {
        private readonly IGenericRepository<PerformancePoint> _performancePointRepository;
        private readonly IGenericRepository<TaskItem> _taskRepository;
        private readonly IGenericRepository<TaskTransaction> _transactionRepository;
        private readonly IUnityOfWork _unity;

        public PerformanceService(IGenericRepository<PerformancePoint> performancePointRepository, IGenericRepository<TaskItem> taskRepository, IGenericRepository<TaskTransaction> transactionRepository, IUnityOfWork unity)
        {
            _performancePointRepository = performancePointRepository;
            _taskRepository = taskRepository;
            _transactionRepository = transactionRepository;
            _unity = unity;
        }

        public async Task<int> GetTotalPointsAsync(string userId)
        {
            var points = await _performancePointRepository.GetAllAsync(
                query => query.Where(p => p.UserId == userId)
            );
            return points.Sum(p => p.Points);
        }

        public async Task AddPerformancePointAsync(PerformancePointDTo performance)
        {

            var ponit = 0;
            var task = await _taskRepository.GetByIdAsync(performance.taskId);
            if (task.CreatedByUserId != performance.senderId)
            {
                throw new UnauthorizedAccessException("Only the creator of the task can assign performance points.");
            }
            if (task.Difficulty == Domain.Enums.DifficultyLevel.Easy)
            {
                ponit = 10;
            }
            else if (task.Difficulty == Domain.Enums.DifficultyLevel.Medium)
            {
                ponit = 20;
            }
            else if (task.Difficulty == Domain.Enums.DifficultyLevel.Hard)
            {
                ponit = 30;
            }

            var performancePoint = new PerformancePoint
            {
                UserId = performance.userId,
                Points = ponit,
                Reason = performance.reason,

            };

            task.Status = Domain.Enums.CurrentSituation.Completed;
            await _taskRepository.UpdateAsync(task);
            await _performancePointRepository.AddAsync(performancePoint);
            await _transactionRepository.AddAsync(new TaskTransaction
            {
                TaskItemId = task.Id,
                FromUserId = task.CreatedByUserId,
                ToUserId = performance.userId,
                Comments = "Performance Point Added"

            });
            await _unity.SaveChangesAsync();
        }

        public async Task<List<LeaderBoardDTO>> leaderboard()
        {

            var points = await _performancePointRepository.GetAllAsync(
                include: q => q.Include(x => x.User)
            );


            var leaderboard = points
                .GroupBy(x => new { x.UserId, x.User.UserName })
                .Select(g => new LeaderBoardDTO
                {
                    UserId = g.Key.UserId,
                    UserName = g.Key.UserName,
                    TotalPoints = g.Sum(x => x.Points)
                })
                .OrderByDescending(x => x.TotalPoints)
                .ToList();

            return leaderboard;
        }




    }
}
