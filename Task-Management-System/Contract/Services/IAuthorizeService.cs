using Contract.DTOs;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Contract.Services
{
    public interface IAuthorizeService
    {
        Task<List<ApplicationUser>> GetAllUsersAsync();
        Task<string> LoginAsync(LoginDTO loginDTO);
        Task<IdentityResult> RegisterAsync(RegisterDTO registerDTO);
        Task LogoutAsync();
        Task AssignRole(string userId, string role);



    }
}
