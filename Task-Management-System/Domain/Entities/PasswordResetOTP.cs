using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class PasswordResetOTP
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Code { get; set; }  
        public DateTime Expiration { get; set; }
        public bool IsUsed { get; set; } = false;

        public ApplicationUser User { get; set; }
    }

}
