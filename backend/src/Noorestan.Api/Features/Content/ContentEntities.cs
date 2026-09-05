using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.Content;

/// <summary>
/// A single published contact phone line. Stored as an owned JSON collection on
/// <see cref="BusinessProfile"/> because a real business commonly has several lines, and some of
/// them double as a fax number (<see cref="IsAlsoFax"/>) rather than being fax-only.
/// </summary>
public sealed class PhoneNumber
{
    public string Number { get; set; } = string.Empty;
    public bool IsAlsoFax { get; set; }
}

public sealed class BusinessProfile : EntityBase
{
    public string BusinessNameFa { get; set; } = "نورستان";
    public string RepresentativeStatementFa { get; set; } = string.Empty;
    public string? AddressFa { get; set; }
    public List<PhoneNumber> Phones { get; set; } = [];
    public string WhatsApp { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? OperatingHoursFa { get; set; }
}

public sealed class ManagedContent : EntityBase
{
    public string SlotKey { get; set; } = string.Empty;
    public string TitleFa { get; set; } = string.Empty;
    public string BodyFa { get; set; } = string.Empty;
    public string? CallToActionLabelFa { get; set; }
    public string? CallToActionTarget { get; set; }
    public bool IsVisible { get; set; } = true;
}
