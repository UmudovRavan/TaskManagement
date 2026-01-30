using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class WorkGroup :BaseEntity 
    { 
        public string Name { get; set; }
        public string LeaderId { get; set; }
        public ApplicationUser Leader { get; set; }
        public ICollection<ApplicationUser> Users { get; set; }
        public ICollection<TaskItem> Tasks { get; set; }
    }
}
