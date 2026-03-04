using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace EventClassLibrary.Models
{
    public class EventItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Link { get; set; } = string.Empty;
        public string Img { get; set; } = string.Empty;
        public string[] Categories { get; set; } = [];
        public string Attendance { get; set; } = string.Empty;
        public string Ort { get; set; } = string.Empty;

        public string? PublisherId { get; set; }
        public ApplicationUser? Publisher { get; set; }

        [JsonPropertyName("dates")]
        public ICollection<EventDates> EventDates { get; set; } = new List<EventDates>();
    }
}
