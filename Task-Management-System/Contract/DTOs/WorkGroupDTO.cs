using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Contract.DTOs
{
    public class WorkGroupDTO
    {
        public int Id { get; set; }            
        public string Name { get; set; }          
        public string LeaderId { get; set; }     
        public List<string> UserIds { get; set; } = new List<string>();
        public List<int> TaskIds { get; set; } 
    }
}
