using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class TaskComment : BaseEntity
    {
        public string Content { get; set; }
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }
        public int TaskId { get; set; }
        public TaskItem TaskItem { get; set; }

        
        public ICollection<TaskCommentMention> TaskCommentMentions { get; set; }
    }

}
