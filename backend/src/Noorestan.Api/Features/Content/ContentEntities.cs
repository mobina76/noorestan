using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.Content;

public sealed class BusinessProfile : EntityBase
{
    public string BusinessNameFa { get; set; } = "نورستان";
    public string RepresentativeStatementFa { get; set; } = string.Empty;
    public string? AddressFa { get; set; }
    public string Phone { get; set; } = string.Empty;
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
