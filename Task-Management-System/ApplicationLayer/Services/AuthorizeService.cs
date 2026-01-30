using Application.Exceptions;
using Contract.DTOs;
using Contract.Services;
using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;

namespace ApplicationLayer.Services
{

    public class AuthorizationService : IAuthorizeService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;

        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<AuthorizationService> _logger;
        private readonly ITokenHandler _tokenHandler;
        private readonly IUserRepository _userRepository;



        public AuthorizationService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,

            RoleManager<IdentityRole> roleManager,
            ILogger<AuthorizationService> logger,
            ITokenHandler tokenHandler,
            IUserRepository userRepository)
        {
            _userManager = userManager;
            _signInManager = signInManager;

            _roleManager = roleManager;
            _logger = logger;
            _tokenHandler = tokenHandler;
            _userRepository = userRepository;
        }

        public async Task<IdentityResult> RegisterAsync(RegisterDTO registerDTO)
        {
            if (registerDTO is null)
                throw new NotNullExceptions("Can not be Null");

            ApplicationUser user = new ApplicationUser
            {
                UserName = registerDTO.Email.Split("@")[0],
                Email = registerDTO.Email,
                PhoneNumber = registerDTO.PhoneNumber,
                EmployeeId = Guid.NewGuid().ToString()

            };


            var result = await _userManager.CreateAsync(user, registerDTO.Password);
            if (!result.Succeeded)
                return result;
            await _userManager.AddToRoleAsync(user, "Employee");

            _logger.LogInformation($"New user registered: {user.Email}");




            return result;
        }






        public async Task<string> LoginAsync(LoginDTO loginDTO)
        {
            var user = await _userManager.FindByEmailAsync(loginDTO.Email);
            if (user == null)
                throw new NotFoundException("User not found.");




            var result = await _signInManager.PasswordSignInAsync(user, loginDTO.Password, true, lockoutOnFailure: false);
            if (result.Succeeded)
            {
                _logger.LogInformation($"User Login in: {user.Email}");
                var token = await _tokenHandler.CreateAccessTokenAsync(user);
                return token;

            }
            else
            {
                _logger.LogWarning($"Invalid login attempt for user: {loginDTO.Email}");
                throw new Exception("Invalid login attempt ");

            }
        }


        public async Task LogoutAsync()
        {

            await _signInManager.SignOutAsync();
        }

        public async Task<List<ApplicationUser>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllUsersAsync();
            return users;
        }

        public async Task AssignRole(string userId, string role) 
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new NotFoundException("User not found.");
            if (!await _roleManager.RoleExistsAsync(role))
                throw new NotFoundException("Role not found.");
            var result = await _userManager.AddToRoleAsync(user, role);
            if (!result.Succeeded)
                throw new Exception("Failed to assign role to user.");

        }

      

    }
}

