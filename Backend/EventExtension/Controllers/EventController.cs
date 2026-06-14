
using EventExtension.DTO;
using EventClassLibrary.Models;
using EventExtension.Data;
using EventExtension.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventExtension.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class EventController : ControllerBase
    {   
        private readonly IEventService _eventService;      
        public EventController(IEventService eventService)
        {
            _eventService = eventService;        
        }

        [HttpGet("GetAllEvents")]
        public async Task<IActionResult> GetEvents()
        {
            var events = await _eventService.GetAllEvents();
            if (events == null)
            {
                return NotFound("No events found.");
            }
            return Ok(events); 
        }

        [HttpGet("Ping")]
        public Task<IActionResult> Ping()
        {
             return Task.FromResult<IActionResult>(Ok("Pong"));
        }
       
        [HttpPost("UploadEvents")]
        public async Task<IActionResult> UploadEvents([FromBody] List<EventItemDto> events)
        {        
            await _eventService.UploadEvents(events);     

            return Ok($"Uploaded and saved {events.Count} events.");
        }

    }
}
