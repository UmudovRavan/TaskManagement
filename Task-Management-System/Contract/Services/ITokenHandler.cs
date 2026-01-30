using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Contract.Services
{
    public interface ITokenHandler
    {
        Task<string> CreateAccessTokenAsync(ApplicationUser user);
        Task<bool> ValidateTokenAsync(string token);
    }
}
