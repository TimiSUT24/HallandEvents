using EventExtension.DTO;
using EventClassLibrary.Models;
using EventExtension.Mapper;
using EventExtension.Repositories.Interfaces;
using EventExtension.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace EventExtension.Services
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly string _backUpFilePath = Path.Combine("/data", "event_backup.json");
        private readonly IMemoryCache _memoryCache;
        private const string cacheKey = "events_cache";
        private static readonly SemaphoreSlim _cacheLock = new(1, 1);

        public EventService(IEventRepository eventRepository,IMemoryCache memoryCache)
        {
            _eventRepository = eventRepository;
            _memoryCache = memoryCache;  
        }

        public async Task<IEnumerable<EventItemDto>> GetAllEvents()
        {
            if(_memoryCache.TryGetValue(cacheKey, out List<EventItemDto> cachedEvents))
            {
                return cachedEvents;
            }
            await _cacheLock.WaitAsync();           

            try
            {
                // check again after acquiring lock
                if (_memoryCache.TryGetValue(cacheKey, out cachedEvents))
                    return cachedEvents;

                var events = await LoadEvents();

                _memoryCache.Set(cacheKey, events);

                return events;
            }
            finally
            {
                _cacheLock.Release();
            }
        }

        public async Task RefreshEvents()
        {
            try
            {
                var events = await _eventRepository.GetAllAsync();
                var mapped = events
                    .Select(e => e.MapEventItemDto())
                    .ToList();
                _memoryCache.Set(cacheKey, mapped);
                var json = JsonSerializer.Serialize(mapped, new JsonSerializerOptions
                {
                    WriteIndented = true
                });
                File.WriteAllText(_backUpFilePath, json);

                Console.WriteLine($"Event cache refreshed: {mapped.Count}");
            }
            catch(Exception ex)
            {
                Console.WriteLine($"[EventService] Db refresh failed, using backup. Error: {ex.Message}");
            }
            
        }

        private async Task<List<EventItemDto>> LoadEvents()
        {
            try
            {
                var events = await _eventRepository.GetAllAsync();

                var mapped = events
                    .Select(e => e.MapEventItemDto())
                    .ToList();

                return mapped;
            }
            catch
            {
                if (File.Exists(_backUpFilePath))
                {
                    var json = File.ReadAllText(_backUpFilePath);

                    return JsonSerializer.Deserialize<List<EventItemDto>>(json) ?? new();
                }

                return new();
            }
        }

        public async Task<IEnumerable<EventItemDto>> RemoveEventsRangeWithId(int id, int id2)
        {
            var events = await _eventRepository.FindAsync(e => e.Id >= id && e.Id <= id2);
            if (events == null || !events.Any())
            {
                throw new Exception("No events found in the specified range.");
            }
            foreach (var eventItem in events)
            {
                await _eventRepository.DeleteAsync(eventItem);
            }
            await _eventRepository.SaveChangesAsync();
            _memoryCache.Remove(cacheKey);
            return events.Select(e => new EventItemDto
            {
                Id = e.Id,
            });

        }

        public async Task UploadEvents(IEnumerable<EventItemDto> events)
        {
            if (events == null || !events.Any())
            {
                throw new ArgumentException("Empty event list.");
            }

            var grouped = events.GroupBy(e => e.Ort);

            foreach(var group in grouped)
            {
                var city = group.Key;
                var eventList = group.ToList();

                await using var transaction = await _eventRepository.BeginTransactionAsync();

                try
                {
                    await _eventRepository.RemoveByCity(city);

                    var entites = eventList.Select(e => e.MapEventItem()).ToList();

                    await _eventRepository.AddRangeAsyncEvents(entites);
                    await _eventRepository.SaveChangesAsync();

                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;

                }
            }

            _memoryCache.Remove(cacheKey);
           
        }
      
    }
}
