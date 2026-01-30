
using Application.Exceptions;
using Contract.DTOs;
using Contract.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthorizeController : ControllerBase
    {
        private readonly IAuthorizeService _authorizeService;
        private readonly IPasswordResetService _passwordResetService;

        public AuthorizeController(IAuthorizeService authorizeService, IPasswordResetService passwordResetService)
        {
            _authorizeService = authorizeService;
            _passwordResetService = passwordResetService;
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
            return Ok(users);
        }
        [Authorize]
        [HttpPost("LogOut")]
        public async Task<IActionResult> LogOut()
        {
            await _authorizeService.LogoutAsync();
            return Ok(new { Message = "User logged out successfully" });
        }
        [Authorize]
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
        [Authorize]
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

