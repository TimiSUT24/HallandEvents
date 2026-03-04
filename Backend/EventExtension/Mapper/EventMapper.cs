using EventClassLibrary.DTO;
using EventClassLibrary.Models;

namespace EventExtension.Mapper
{
    public static class EventMapper
    {
        public static EventItem MapEventItem(this EventItemDto dto)
        {
            return new EventItem
            {
                Id = dto.Id,
                Title = dto.Title,
                Description = dto.Description,
                Location = dto.Location,
                Link = dto.Link,
                Img = dto.Img,
                Categories = dto.Categories,
                Attendance = dto.Attendance,
                Ort = dto.Ort,
                EventDates = dto.Dates.Select(d => new EventDates
                {
                    Id = d.Id,
                    StartDate = d.StartDate,
                    EndDate = d.EndDate,
                    Time = d.Time
                }).ToList()
            };
        }

        public static EventItemDto MapEventItemDto(this EventItem eventItem)
        {
            return new EventItemDto
            {
                Id = eventItem.Id,
                Title = eventItem.Title,
                Description = eventItem.Description,
                Location = eventItem.Location,
                Link = eventItem.Link,
                Img = eventItem.Img,
                Categories = eventItem.Categories,
                Attendance = eventItem.Attendance,
                Ort = eventItem.Ort,
                Dates = eventItem.EventDates.Select(ed => new EventDatesDto
                {
                    Id = ed.Id,
                    StartDate = ed.StartDate,
                    EndDate = ed.EndDate,
                    Time = ed.Time
                }).ToList()
            };
        }
    }
}
