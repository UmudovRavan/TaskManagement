using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Contract.DTOs
{
    public class TaskCommentDTO
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public string UserId { get; set; }
      
        public int TaskId { get; set; }
     

        public List<string>? TaskCommentMentionIDs{ get; set; }
    }
}
