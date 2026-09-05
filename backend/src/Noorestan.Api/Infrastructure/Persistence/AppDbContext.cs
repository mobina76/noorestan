using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Noorestan.Api.Features.Catalog;
using Noorestan.Api.Features.Content;
using Noorestan.Api.Features.CatalogImports;
using Noorestan.Api.Infrastructure.Auditing;
using Noorestan.Api.Infrastructure.Identity;

namespace Noorestan.Api.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AdministratorAccount, Microsoft.AspNetCore.Identity.IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<SpecificationDefinition> SpecificationDefinitions => Set<SpecificationDefinition>();
    public DbSet<SpecificationChoice> SpecificationChoices => Set<SpecificationChoice>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductFeature> ProductFeatures => Set<ProductFeature>();
    public DbSet<ProductSpecificationValue> ProductSpecificationValues => Set<ProductSpecificationValue>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ImageVariant> ImageVariants => Set<ImageVariant>();
    public DbSet<BusinessProfile> BusinessProfiles => Set<BusinessProfile>();
    public DbSet<ManagedContent> ManagedContents => Set<ManagedContent>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<ImportRun> ImportRuns => Set<ImportRun>();
    public DbSet<ImportItem> ImportItems => Set<ImportItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.HasPostgresEnum<ProductStatus>();
        builder.HasPostgresEnum<SpecificationValueType>();
        builder.HasPostgresEnum<ImageProcessingStatus>();

        builder.Entity<AdministratorAccount>().HasIndex(x => x.IsOwner).IsUnique().HasFilter("\"IsOwner\" = TRUE");
        builder.Entity<AdministratorAccount>().Property(x => x.Version).IsConcurrencyToken();
        builder.Entity<Category>().HasIndex(x => x.Slug).IsUnique();
        builder.Entity<Category>().HasIndex(x => x.NormalizedNameFa);
        builder.Entity<SpecificationDefinition>().HasIndex(x => new { x.CategoryId, x.Key }).IsUnique();
        builder.Entity<SpecificationChoice>().HasIndex(x => new { x.DefinitionId, x.Key }).IsUnique();
        builder.Entity<Product>().HasIndex(x => x.Slug).IsUnique();
        builder.Entity<Product>().HasIndex(x => x.MazinoorProductCode).IsUnique().HasFilter("\"MazinoorProductCode\" IS NOT NULL");
        builder.Entity<Product>().HasIndex(x => x.SourceUrl).IsUnique().HasFilter("\"SourceUrl\" IS NOT NULL");
        builder.Entity<Product>().HasIndex(x => new { x.Status, x.CategoryId, x.DisplayOrder });
        builder.Entity<ProductSpecificationValue>().HasIndex(x => new { x.ProductId, x.DefinitionId }).IsUnique();
        builder.Entity<ProductSpecificationValue>().Property(x => x.NumericValue).HasPrecision(18, 4);
        builder.Entity<ProductFeature>().HasIndex(x => new { x.ProductId, x.DisplayOrder }).IsUnique();
        builder.Entity<ProductImage>().HasIndex(x => new { x.ProductId, x.DisplayOrder }).IsUnique();
        builder.Entity<ProductImage>().HasIndex(x => x.ProductId).IsUnique().HasFilter("\"IsPrimary\" = TRUE");
        builder.Entity<ImageVariant>().HasIndex(x => x.ObjectKey).IsUnique();
        builder.Entity<ImageVariant>().HasIndex(x => new { x.ProductImageId, x.Format, x.Width }).IsUnique();
        builder.Entity<ManagedContent>().HasIndex(x => x.SlotKey).IsUnique();
        builder.Entity<ImportRun>().HasIndex(x => x.Status);
        builder.Entity<ImportItem>().HasIndex(x => new { x.ImportRunId, x.CanonicalSourceUrl }).IsUnique();
        builder.Entity<AuditEvent>().HasIndex(x => x.OccurredAt);

        foreach (var entity in builder.Model.GetEntityTypes().Where(x => typeof(EntityBase).IsAssignableFrom(x.ClrType)))
        {
            builder.Entity(entity.ClrType).Property(nameof(EntityBase.Version)).IsConcurrencyToken();
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<EntityBase>())
        {
            if (entry.State is EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                entry.Entity.Version++;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
