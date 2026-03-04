
using EventExtension.Services.Interfaces;

namespace EventExtension.Services
{
    public class DailyEventCacheRefresh : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        public DailyEventCacheRefresh(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var swedishTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Stockholm"); //Swedish timezone

            using(var scope = _serviceProvider.CreateScope())
            {
                var eventService = scope.ServiceProvider.GetRequiredService<IEventService>();
                var cachedEvents = await eventService.GetAllEvents();

                if (cachedEvents == null || !cachedEvents.Any())
                {
                    Console.WriteLine("Initial cache is empty, performing first-time refresh.");
                    await eventService.RefreshEvents();
                }
                else
                {
                    Console.WriteLine($"Initial cache loaded with {cachedEvents.Count()} events.");
                }
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                // Convert to swedish time 
                var now = TimeZoneInfo.ConvertTime(DateTime.UtcNow, swedishTimeZone);
                var nextRun = now.Date.AddHours(7); //Next run at 7 AM

                //if past time today, schedule for tomorrow
                if (now > nextRun)
                {
                    nextRun = nextRun.AddDays(1);
                }
                var delay = nextRun - now; //How long until next run 
                Console.WriteLine($"Next cache refresh scheduled at: {nextRun} (in {delay.TotalHours} hours)");

                try
                {
                    await Task.Delay(delay, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }


                using (var scope = _serviceProvider.CreateScope())
                {
                    var eventService = scope.ServiceProvider.GetRequiredService<IEventService>();
                    await eventService.RefreshEvents();
                    Console.WriteLine("Event refreshed from db");
                }              
            }
        }
    }
}
