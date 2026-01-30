using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class PerformancePoint : BaseEntity
    {
        public string UserId { get; set; }
        public int Points { get; set; }
        public string Reason { get; set; }
        public ApplicationUser User { get; set; }
    }
}
