using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.Catalog;

public enum ProductStatus { Draft, Published, Hidden, Archived }
public enum SpecificationValueType { Text, Number, Boolean, Choice }
public enum ImageProcessingStatus { Processing, Ready, Failed }

public sealed class Category : EntityBase
{
    public string Slug { get; set; } = string.Empty;
    public string NameFa { get; set; } = string.Empty;
    public string NormalizedNameFa { get; set; } = string.Empty;
    public string? DescriptionFa { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    public List<Product> Products { get; set; } = [];
    public List<SpecificationDefinition> Specifications { get; set; } = [];
}

public sealed class SpecificationDefinition : EntityBase
{
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public string Key { get; set; } = string.Empty;
    public string LabelFa { get; set; } = string.Empty;
    public SpecificationValueType ValueType { get; set; }
    public string? UnitFa { get; set; }
    public bool IsRequired { get; set; }
    public bool IsFilterable { get; set; }
    public int DisplayOrder { get; set; }
    public List<SpecificationChoice> Choices { get; set; } = [];
}

public sealed class SpecificationChoice : EntityBase
{
    public Guid DefinitionId { get; set; }
    public SpecificationDefinition Definition { get; set; } = null!;
    public string Key { get; set; } = string.Empty;
    public string LabelFa { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class Product : EntityBase
{
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public string Slug { get; set; } = string.Empty;
    public string? MazinoorProductCode { get; set; }
    public string? SourceUrl { get; set; }
    public string? SourceContentHash { get; set; }
    public DateTimeOffset? LastImportedAt { get; set; }
    public string NameFa { get; set; } = string.Empty;
    public string NormalizedNameFa { get; set; } = string.Empty;
    public string ShortDescriptionFa { get; set; } = string.Empty;
    public string DescriptionFa { get; set; } = string.Empty;
    public string? TechnicalNotesFa { get; set; }
    public ProductStatus Status { get; set; } = ProductStatus.Draft;
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
    public int DisplayOrder { get; set; }
    public List<ProductFeature> Features { get; set; } = [];
    public List<ProductSpecificationValue> SpecificationValues { get; set; } = [];
    public List<ProductImage> Images { get; set; } = [];
}

public sealed class ProductFeature : EntityBase
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string TextFa { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public sealed class ProductSpecificationValue : EntityBase
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public Guid DefinitionId { get; set; }
    public SpecificationDefinition Definition { get; set; } = null!;
    public string? TextValue { get; set; }
    public string? NormalizedTextValue { get; set; }
    public decimal? NumericValue { get; set; }
    public bool? BooleanValue { get; set; }
    public Guid? ChoiceId { get; set; }
    public SpecificationChoice? Choice { get; set; }
}

public sealed class ProductImage : EntityBase
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string OriginalObjectKey { get; set; } = string.Empty;
    public ImageProcessingStatus Status { get; set; } = ImageProcessingStatus.Processing;
    public string MediaType { get; set; } = string.Empty;
    public long ByteSize { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public string Checksum { get; set; } = string.Empty;
    public string AltTextFa { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsPrimary { get; set; }
    public List<ImageVariant> Variants { get; set; } = [];
}

public sealed class ImageVariant : EntityBase
{
    public Guid ProductImageId { get; set; }
    public ProductImage ProductImage { get; set; } = null!;
    public string Format { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public long ByteSize { get; set; }
    public string ObjectKey { get; set; } = string.Empty;
}
