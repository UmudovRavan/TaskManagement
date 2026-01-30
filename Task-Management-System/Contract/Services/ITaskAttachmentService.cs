using Contract.DTOs;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Contract.Services
{
    public interface ITaskAttachmentService
    {
        Task<string> GetPreviewUrlAsync(int attachmentId, string currentUserId);
        Task<FileDto> DownloadAsync(int attachmentId, string currentUserId);
        Task<TaskAttachment> UploadAndSaveAsync(int taskId, FileDto fileDto, string currentUserId);
    }

}
