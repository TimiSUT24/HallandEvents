using EventExtension.DTO;
using EventClassLibrary.Models;

namespace EventExtension.Services.Interfaces
{
    public interface IEventService
    {
        Task<IEnumerable<EventItemDto>> GetAllEvents();
        Task UploadEvents(IEnumerable<EventItemDto> events);
        Task RefreshEvents();
    }
}
