
using Application.Exceptions;
using Contract.DTOs;
using Contract.Services;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthorizeController : ControllerBase
    {
        private readonly IAuthorizeService _authorizeService;
        private readonly IPasswordResetService _passwordResetService;
        private readonly UserManager<ApplicationUser> _userManager;

        public AuthorizeController(IAuthorizeService authorizeService, IPasswordResetService passwordResetService, UserManager<ApplicationUser> userManager)
        {
            _authorizeService = authorizeService;
            _passwordResetService = passwordResetService;
            _userManager = userManager;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO loginDTO)
        {
            var token = await _authorizeService.LoginAsync(loginDTO);
            return Ok(new { Token = token });
        }
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO registerDTO)
        {
            var result = await _authorizeService.RegisterAsync(registerDTO);
            if (result.Succeeded)
            {
                return Ok(new { Message = "User registered successfully" });
            }
            else
            {
                throw new UnauthorizedException("Register UnSuccessfuly");
            }
        }
        [Authorize]
        [HttpGet("AllUsers")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _authorizeService.GetAllUsersAsync();
            var result = new List<object>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                result.Add(new
                {
                    id = user.Id,
                    userName = user.UserName,
                    email = user.Email,
                    role = roles.FirstOrDefault() ?? "Employee"
                });
            }
            return Ok(result);
        }
        [Authorize]
        [HttpPost("LogOut")]
        public async Task<IActionResult> LogOut()
        {
            await _authorizeService.LogoutAsync();
            return Ok(new { Message = "User logged out successfully" });
        }
        [AllowAnonymous]
        [HttpPost("ResetPassword")]
        public async Task<IActionResult> ResetPassword([FromBody] PasswordResetDTO passwordResetDTO)
        {
            var result = await _passwordResetService.ResetPasswordAsync(passwordResetDTO.Email, passwordResetDTO.Token, passwordResetDTO.NewPassword);
            if (result.Succeeded)
            {
                return Ok(new { Message = "Password reset successfully" });
            }
            else
            {
                throw new UnauthorizedException("Password reset UnSuccessfuly");
            }

        }
        [AllowAnonymous]
        [HttpPost("SendResetOtp")]

        public async Task<IActionResult> SendResetOtp([FromBody] string emailDTO)
        {
            await _passwordResetService.SendOtpAsync(emailDTO);
            return Ok(new { Message = "Password reset OTP sent successfully" });
        }


        [Authorize]
        [HttpPost("AssignRole")]
        public async Task<IActionResult> AssignRole( string userId ,string role)
        {
            await _authorizeService.AssignRole(userId, role);
            return Ok(new { Message = "Role assigned successfully" });
        }
    }
}

