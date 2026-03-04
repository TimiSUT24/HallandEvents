using EventClassLibrary.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EventExtension.Data
{
    public class EventDBContext : IdentityDbContext<ApplicationUser>
    {
        public EventDBContext(DbContextOptions<EventDBContext> options) : base(options)
        {
        }

        public DbSet<EventItem> Events { get; set; }
        public DbSet<EventDates> EventDate { get; set; }
        public DbSet<ApplicationUser> Users { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<EventItem>().ToTable("Events");
            modelBuilder.Entity<EventItem>().HasKey(e => e.Id);
            modelBuilder.Entity<EventItem>().Property(e => e.Title).HasMaxLength(300);           
            modelBuilder.Entity<EventItem>().Property(e => e.Description);
            modelBuilder.Entity<EventItem>().Property(e => e.Location).HasMaxLength(500);           
            modelBuilder.Entity<EventItem>().Property(e => e.Link);
            modelBuilder.Entity<EventItem>().Property(e => e.Img);
            modelBuilder.Entity<EventItem>().Property(e => e.Categories).HasMaxLength(500);
            modelBuilder.Entity<EventItem>().Property(e => e.Attendance);
            modelBuilder.Entity<EventItem>().Property(e => e.Ort);
            

            modelBuilder.Entity<EventDates>()
                .ToTable("EventDates")
                .HasKey(ed => ed.Id);          
            modelBuilder.Entity<EventDates>()
                .HasOne(ed => ed.EventItem)
                .WithMany(e => e.EventDates)
                .HasForeignKey(ed => ed.EventId)
                .OnDelete(DeleteBehavior.Cascade);   
            
            modelBuilder.Entity<EventItem>()
                .HasOne(e => e.Publisher)
                .WithMany(u => u.PublishedEvents)
                .HasForeignKey(e => e.PublisherId)
                .OnDelete(DeleteBehavior.Restrict);  



        }
    }
}
