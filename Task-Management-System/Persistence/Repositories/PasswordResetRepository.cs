using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using System;
using System.Collections.Generic;
using System.Text;

namespace Persistence.Repositories
{
    public class PasswordResetRepository : IPasswordResetRepository
    {
        private readonly AppDbContext _context;

        public PasswordResetRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task AddAsync(PasswordResetOTP otp)
        {
            _context.PasswordResetOtps.Add(otp);
            return Task.CompletedTask;
        }

      

        public Task RemoveAsync(PasswordResetOTP otp)
        {
            var existingOtp = _context.PasswordResetOtps.Find(otp.Id);
            if (existingOtp != null)
            {
                existingOtp.IsUsed = true;
            }
            else
            {
                throw new InvalidOperationException("OTP not found.");
            }
            return Task.CompletedTask;
        }

        Task<PasswordResetOTP> IPasswordResetRepository.GetValidOtpAsync(string userId, string code)
        {
            return  _context.PasswordResetOtps
           .Where(x => x.UserId == userId && x.Code == code && x.Expiration > DateTime.UtcNow)
           .FirstOrDefaultAsync();
        }
    }

}
