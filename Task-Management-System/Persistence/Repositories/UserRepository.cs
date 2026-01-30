using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using System;
using System.Collections.Generic;
using System.Text;

namespace Persistence.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _db;

        public UserRepository(AppDbContext db)
        {
            _db = db;
        }

        public  Task<List<ApplicationUser>> GetAllUsersAsync()
        {
            var data = _db.Users.Include(u => u.PerformancePoints).ToListAsync();
            return data;
        }
    }
}
