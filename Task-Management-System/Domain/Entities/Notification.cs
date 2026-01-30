using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Notification : BaseEntity
    {
        public string UserId { get; set; }
        public string Message { get; set; }
        public bool IsRead { get; set; }
        public int? TaskId { get; set; }
        public ApplicationUser User { get; set; }
    }
}
