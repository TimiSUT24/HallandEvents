using EventClassLibrary.Models;
using EventExtension.Data;
using EventExtension.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace EventExtension.Repositories
{
    public class EventRepository : IEventRepository
    {
        private readonly EventDBContext _context;

        public EventRepository(EventDBContext context)
        {
            _context = context;
        }
        public Task AddAsync(EventItem entity)
        {
            throw new NotImplementedException();
        }

        public Task<bool> AnyAsync(Expression<Func<EventItem, bool>> predicate)
        {
            throw new NotImplementedException();
        }

        public async Task DeleteAsync(EventItem entity)
        {
            await _context.Events
                .Where(e => e.Id == entity.Id)
                .ExecuteDeleteAsync();
        }

        public async Task<IEnumerable<EventItem>> FindAsync(Expression<Func<EventItem, bool>> predicate)
        {
            return await _context.Events.Where(predicate).ToListAsync();
        }

        public async Task<IEnumerable<EventItem>> GetAllAsync()
        {
            return await _context.Events.Include(e => e.EventDates).ToListAsync();
        }

        public Task<EventItem?> GetByIdAsync(int id)
        {
            throw new NotImplementedException();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public Task UpdateAsync(EventItem entity)
        {
            throw new NotImplementedException();
        }

        public async Task RemoveRange()
        {
            var events = await _context.Events.ToListAsync();
            _context.Events.RemoveRange(events);

        }       
        public async Task AddRangeAsyncEvents(IEnumerable<EventItem> entity)
        {
            await _context.Events.AddRangeAsync(entity);          
        }
    }
}
