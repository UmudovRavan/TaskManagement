using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class TaskTransaction : BaseEntity
    {
       public int TaskItemId { get; set; }

        public string FromUserId { get; set; }
        public string ToUserId { get; set; }
        public string Comments { get; set; }

        public TaskItem TaskItem { get; set; }
        public ApplicationUser FromUser { get; set; }
        public ApplicationUser ToUser { get; set; }
    }
}
