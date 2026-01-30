using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Contract.DTOs
{
    public class PerformancePointDTo
    {
       public  string userId { get; set; }
          public  int taskId { get; set; }
          public string reason { get; set; }    
        public string senderId { get; set; }
    }
}
