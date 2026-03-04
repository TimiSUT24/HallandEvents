using EventClassLibrary.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventClassLibrary.DTO
{
    public class EventItemDto
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
        public List<EventDatesDto> Dates { get; set; } = new List<EventDatesDto>();
    }
}
