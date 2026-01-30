using Contract.DTOs;
using Contract.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WorkGroupController : ControllerBase
    {
        private readonly IWorkGroupService _workGroupService;

        public WorkGroupController(IWorkGroupService workGroupService)
        {
            _workGroupService = workGroupService;
        }

   
        [HttpPost]
        public async Task<IActionResult> CreateWorkGroup([FromBody] WorkGroupDTO workgroupDto)
        {
            var result = await _workGroupService.CreateWorkGroupAsync(workgroupDto);
            return Ok(result);
        }


        [HttpGet]
        public async Task<IActionResult> GetAllWorkGroups()
        {
            var workgroups = await _workGroupService.GetAllWorkGroupsAsync();
            return Ok(workgroups);
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetWorkGroup(int id)
        {
            var workgroup = await _workGroupService.GetWorkGroupByIdAsync(id);
            return Ok(workgroup);
        }

      
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorkGroup(int id, [FromBody] WorkGroupDTO workgroupDto)
        {
            await _workGroupService.UpdateWorkGroupAsync(workgroupDto);
            return Ok();
        }

        
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkGroup(int id)
        {
            await _workGroupService.DeleteWorkGroupAsync(id);
            return Ok();
        }

        [HttpPost("{workGroupId}/AddUser/{userId}")]
        public async Task<IActionResult> AddUserToWorkGroup(int workGroupId, string userId)
        {
            await _workGroupService.AddUserToWorkGroupAsync(workGroupId, userId);
            return Ok(new { Message = "User added to workgroup successfully" });
        }

        [HttpPost("{workGroupId}/RemoveUser/{userId}")]
        public async Task<IActionResult> RemoveUserFromWorkGroup(int workGroupId, string userId)
        {
            await _workGroupService.RemoveUserFromWorkGroupAsync(workGroupId, userId);
            return Ok(new { Message = "User removed from workgroup successfully" });
        }

        [HttpPost("AssignTask")]
        public async Task<IActionResult> AssignTaskToGroup(int taskId, int targetWorkGroupId)
        {
            var leaderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _workGroupService.AssignTaskToGroupAsync(taskId, leaderId, targetWorkGroupId);
            return Ok(new { Message = "Task assigned to target group successfully" });
        }
    }
}
