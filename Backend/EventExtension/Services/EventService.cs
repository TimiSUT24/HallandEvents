using EventClassLibrary.DTO;
using EventClassLibrary.Models;
using EventExtension.Mapper;
using EventExtension.Repositories.Interfaces;
using EventExtension.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EventExtension.Services
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private List<EventItemDto> _cachedEvents = new();
        private readonly string _backUpFilePath = Path.Combine("/data", "event_backup.json"); 

        public EventService(IEventRepository eventRepository)
        {
            _eventRepository = eventRepository;

            if (File.Exists(_backUpFilePath))
            {
                var json = File.ReadAllText(_backUpFilePath);
                var loadedEvents  = JsonSerializer.Deserialize<List<EventItemDto>>(json) ?? new List<EventItemDto>();

                if(loadedEvents != null && loadedEvents.Any())
                {
                    _cachedEvents = loadedEvents;
                    Console.WriteLine("Loaded events from backup JSON file");
                }
                else
                {
                    Console.WriteLine("Backup JSON file is empty or invalid.");
                }              
            }  
        }

        public Task<IEnumerable<EventItemDto>> GetAllEvents()
        {
            return Task.FromResult<IEnumerable<EventItemDto>>(_cachedEvents);
        }

        public async Task RefreshEvents()
        {
            try
            {
                var events = await _eventRepository.GetAllAsync();
                _cachedEvents = events.Select(e => e.MapEventItemDto()).ToList();
                Console.WriteLine($"Event cache refreshed. Total events cached: {_cachedEvents.Count}");

                var json = JsonSerializer.Serialize(_cachedEvents, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_backUpFilePath, json);
            }
            catch(Exception ex)
            {
                Console.WriteLine($"[EventService] Db refresh failed, using backup. Error: {ex.Message}");
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

            await _eventRepository.RemoveRange();
                     
            var eventEntities = events.Select(e => e.MapEventItem()).ToList();
            
            await _eventRepository.AddRangeAsyncEvents(eventEntities);         
            await _eventRepository.SaveChangesAsync();
           
        }
      
    }
}
