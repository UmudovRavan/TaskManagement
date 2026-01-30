using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class TaskAttachment : BaseEntity
    {
        public int TaskId { get; set; }
        public TaskItem Task { get; set; }

        public string FileName { get; set; }     
        public string ObjectName { get; set; }   
        public string ContentType { get; set; }
        public long Size { get; set; }
    }
}
