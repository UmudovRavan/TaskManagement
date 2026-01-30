using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Repositories
{
    public interface IPasswordResetRepository
    {
        Task AddAsync(PasswordResetOTP otp);
        Task<PasswordResetOTP> GetValidOtpAsync(string userId, string code);
        Task RemoveAsync(PasswordResetOTP otp);
    }
}
