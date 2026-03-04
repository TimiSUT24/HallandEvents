using EventClassLibrary.Models;

namespace EventExtension.Repositories.Interfaces
{
    public interface IEventRepository : IGenericRepository<EventItem>
    {
          Task RemoveRange();       
          Task AddRangeAsyncEvents(IEnumerable<EventItem> entity);
    }
}
