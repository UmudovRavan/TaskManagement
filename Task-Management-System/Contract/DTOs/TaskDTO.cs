using Domain.Entities;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Contract.DTOs
{
    public class TaskDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DifficultyLevel Difficulty { get; set; }
       public CurrentSituation Status { get; set; }
        public DateTime Deadline { get; set; }
        public int? WorkGroupId { get; set; }
        public string? AssignedToUserId { get; set; }
        public string CreatedByUserId { get; set; }

        public int? ParentTaskId { get; set; }
        public List<int>?TaskCommentId { get; set; }
        public List<FileDto>? Files { get; set; }
    }
}
