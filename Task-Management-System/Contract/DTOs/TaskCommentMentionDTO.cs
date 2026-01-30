using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Contract.DTOs
{
    public record TaskCommentMentionDTO
    {
        public int CommentId { get; set; }
        public string MentionedUserId { get; set; }
    }
}
