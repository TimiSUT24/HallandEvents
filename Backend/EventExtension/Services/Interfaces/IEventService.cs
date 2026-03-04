using EventClassLibrary.DTO;
using EventClassLibrary.Models;

namespace EventExtension.Services.Interfaces
{
    public interface IEventService
    {
        Task<IEnumerable<EventItemDto>> GetAllEvents();
        Task<IEnumerable<EventItemDto>> RemoveEventsRangeWithId(int id, int id2);

        Task UploadEvents(IEnumerable<EventItemDto> events);
        Task RefreshEvents();
    }
}
