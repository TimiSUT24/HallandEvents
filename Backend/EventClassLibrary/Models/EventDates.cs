using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventClassLibrary.Models
{
    public class EventDates
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public EventItem? EventItem { get; set; }
        public DateOnly? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public string Time { get; set; } = string.Empty;
    }
}
