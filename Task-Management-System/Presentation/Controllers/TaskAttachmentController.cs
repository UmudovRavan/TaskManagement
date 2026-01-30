using Contract.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TaskAttachmentController : ControllerBase
    {
        private readonly ITaskAttachmentService _taskAttachmentService;
        public TaskAttachmentController(ITaskAttachmentService taskAttachmentService)
        {
            _taskAttachmentService = taskAttachmentService;
        }

        [HttpGet("{attachmentId}/download")]
        public async Task<IActionResult> DownloadAttachment(int attachmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var fileDto = await _taskAttachmentService.DownloadAsync(attachmentId ,userId);
            if (fileDto == null)
            {
                return NotFound();
            }
            return File(fileDto.Content, fileDto.ContentType, fileDto.FileName);
        }


        [HttpGet("{attachmentId}/preview-url")]
        public async Task<IActionResult> GetPresignedUrl(int attachmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var url = await _taskAttachmentService.GetPreviewUrlAsync(attachmentId, userId);
            if (url == null)
            {
                return NotFound();
            }
            return Ok(new { Url = url });
        }
    }
}
