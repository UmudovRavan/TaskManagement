using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Contract.Services
{
    public interface IPasswordResetService
    {
        Task SendOtpAsync(string email);
        Task<IdentityResult> ResetPasswordAsync(string email, string otp, string newPassword);
    }
}
