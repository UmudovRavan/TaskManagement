using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class TaskItem : BaseEntity
    {
        public string Title { get; set; }
        public string Description { get; set; }
       public DifficultyLevel Difficulty { get; set; }
       public CurrentSituation Status { get; set; }
        public DateTime Deadline { get; set; }
        public string? AssignedToUserId { get; set; }
        public int? AssignedWorkGroupId { get; set; }
        public string CreatedByUserId { get; set; } 
        public ApplicationUser? AssignedToUser { get; set; }
        public WorkGroup? AssignedWorkGroup { get; set; }
        public ApplicationUser CreatedByUser { get; set; }
        public int? ParentTaskId { get; set; }

        public List<TaskComment> ?TaskComments { get; set; }
        public List<TaskAttachment>? Attachments { get; set; }

    }
}
