using EventClassLibrary.Models;
using Microsoft.EntityFrameworkCore.Storage;

namespace EventExtension.Repositories.Interfaces
{
    public interface IEventRepository : IGenericRepository<EventItem>
    {
          Task RemoveRange();       
          Task AddRangeAsyncEvents(IEnumerable<EventItem> entity);
          Task<IDbContextTransaction> BeginTransactionAsync();
          Task RemoveByCity(string city);
    }
}
