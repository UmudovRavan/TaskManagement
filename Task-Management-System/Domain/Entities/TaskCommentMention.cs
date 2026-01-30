using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class TaskCommentMention : BaseEntity
    {
        public int CommentId { get; set; }
        public string MentionedUserId { get; set; }
        public TaskComment TaskComment { get; set; }
        public ApplicationUser MentionedUser { get; set; }
    }
}
