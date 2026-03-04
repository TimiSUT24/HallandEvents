using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventClassLibrary.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string Fullname { get; set; } = string.Empty;
        public ICollection<EventItem> PublishedEvents { get; set; } = new List<EventItem>();
    }
}
