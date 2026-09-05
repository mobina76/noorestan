export interface Page<T> {
  readonly items: ReadonlyArray<T>;
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export interface ProblemDetails {
  readonly type?: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly correlationId?: string;
  readonly errors?: Readonly<Record<string, ReadonlyArray<string>>>;
}

// ---- Public catalog ----

export interface CategorySummary {
  readonly id: string;
  readonly slug: string;
  readonly nameFa: string;
  readonly descriptionFa?: string | null;
  readonly productCount: number;
}

export type SpecificationValueType = 'Text' | 'Number' | 'Boolean' | 'Choice';

export interface CategoryFilter {
  readonly key: string;
  readonly labelFa: string;
  readonly type: string;
  readonly unitFa?: string | null;
  readonly options: ReadonlyArray<string>;
}

export interface ProductImageRef {
  readonly url: string;
  readonly altTextFa: string;
}

export interface PublicProductSummary {
  readonly id: string;
  readonly slug: string;
  readonly nameFa: string;
  readonly mazinoorProductCode?: string | null;
  readonly category: string;
  readonly shortDescriptionFa: string;
  readonly primaryImage?: ProductImageRef | null;
}

export interface ImageVariantDto {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly mediaType?: string;
}

export interface PublicProductImage {
  readonly id: string;
  readonly altTextFa: string;
  readonly isPrimary: boolean;
  readonly variants: ReadonlyArray<ImageVariantDto>;
}

export interface PublicSpecification {
  readonly key: string;
  readonly labelFa: string;
  readonly displayValueFa: string;
  readonly unitFa?: string | null;
}

export interface PublicProductDetail {
  readonly id: string;
  readonly slug: string;
  readonly nameFa: string;
  readonly mazinoorProductCode?: string | null;
  readonly category: { readonly slug: string; readonly nameFa: string };
  readonly shortDescriptionFa: string;
  readonly descriptionFa: string;
  readonly technicalNotesFa?: string | null;
  readonly features: ReadonlyArray<string>;
  readonly specifications: ReadonlyArray<PublicSpecification>;
  readonly images: ReadonlyArray<PublicProductImage>;
}

export interface ManagedContentSlot {
  readonly slotKey: string;
  readonly titleFa: string;
  readonly bodyFa: string;
  readonly callToActionLabelFa?: string | null;
  readonly callToActionTarget?: string | null;
}

export interface PublicSite {
  readonly businessNameFa: string;
  readonly representativeStatementFa: string;
  readonly phone: string;
  readonly whatsApp: string;
  readonly email: string;
  readonly addressFa?: string | null;
  readonly content: ReadonlyArray<ManagedContentSlot>;
}

// ---- Admin ----

export type ProductStatus = 'Draft' | 'Published' | 'Hidden' | 'Archived';

export interface AdminCategory {
  readonly id: string;
  readonly slug: string;
  readonly nameFa: string;
  readonly descriptionFa?: string | null;
  readonly displayOrder: number;
  readonly isVisible: boolean;
  readonly version: number;
  readonly productCount: number;
}

export interface CategoryWrite {
  readonly slug: string;
  readonly nameFa: string;
  readonly descriptionFa?: string | null;
  readonly displayOrder: number;
  readonly isVisible: boolean;
}

export interface SpecificationChoiceDto {
  readonly id: string;
  readonly key: string;
  readonly labelFa: string;
  readonly displayOrder: number;
  readonly isActive: boolean;
}

export interface AdminSpecificationDefinition {
  readonly id: string;
  readonly key: string;
  readonly labelFa: string;
  readonly valueType: SpecificationValueType;
  readonly unitFa?: string | null;
  readonly isRequired: boolean;
  readonly isFilterable: boolean;
  readonly displayOrder: number;
  readonly version: number;
  readonly choices: ReadonlyArray<SpecificationChoiceDto>;
}

export interface SpecificationDefinitionWrite {
  readonly key: string;
  readonly labelFa: string;
  readonly valueType: SpecificationValueType;
  readonly unitFa?: string | null;
  readonly isRequired: boolean;
  readonly isFilterable: boolean;
  readonly displayOrder: number;
  readonly choices: ReadonlyArray<string>;
}

export interface AdminProductSummary {
  readonly id: string;
  readonly nameFa: string;
  readonly slug: string;
  readonly mazinoorProductCode?: string | null;
  readonly status: ProductStatus;
  readonly categoryId: string;
  readonly categoryNameFa: string;
  readonly version: number;
  readonly updatedAt: string;
  readonly primaryImageUrl?: string | null;
}

export interface AdminProductImage {
  readonly id: string;
  readonly altTextFa: string;
  readonly isPrimary: boolean;
  readonly displayOrder: number;
  readonly status: 'Processing' | 'Ready' | 'Failed';
  readonly width: number;
  readonly height: number;
  readonly url: string;
  readonly variants: ReadonlyArray<{ readonly url: string; readonly width: number; readonly height: number }>;
}

export interface AdminSpecificationValue {
  readonly definitionId: string;
  readonly key: string;
  readonly labelFa: string;
  readonly valueType: SpecificationValueType;
  readonly unitFa?: string | null;
  readonly isRequired: boolean;
  readonly textValue?: string | null;
  readonly numericValue?: number | null;
  readonly booleanValue?: boolean | null;
  readonly choiceId?: string | null;
  readonly choices: ReadonlyArray<{ readonly id: string; readonly labelFa: string }>;
}

export interface AdminProductDetail {
  readonly id: string;
  readonly slug: string;
  readonly nameFa: string;
  readonly mazinoorProductCode?: string | null;
  readonly sourceUrl?: string | null;
  readonly categoryId: string;
  readonly categoryNameFa: string;
  readonly shortDescriptionFa: string;
  readonly descriptionFa: string;
  readonly technicalNotesFa?: string | null;
  readonly status: ProductStatus;
  readonly displayOrder: number;
  readonly version: number;
  readonly features: ReadonlyArray<string>;
  readonly specifications: ReadonlyArray<AdminSpecificationValue>;
  readonly images: ReadonlyArray<AdminProductImage>;
}

export interface ProductWrite {
  readonly categoryId: string;
  readonly slug: string;
  readonly nameFa: string;
  readonly shortDescriptionFa: string;
  readonly descriptionFa: string;
  readonly technicalNotesFa?: string | null;
  readonly displayOrder: number;
  readonly features: ReadonlyArray<string>;
}

export interface SpecificationValueWrite {
  readonly definitionId: string;
  readonly textValue?: string | null;
  readonly numericValue?: number | null;
  readonly booleanValue?: boolean | null;
  readonly choiceId?: string | null;
}

export interface BusinessProfile {
  readonly id?: string;
  readonly businessNameFa: string;
  readonly representativeStatementFa: string;
  readonly addressFa?: string | null;
  readonly phone: string;
  readonly whatsApp: string;
  readonly email: string;
  readonly operatingHoursFa?: string | null;
  readonly version?: number;
}

export interface ManagedContentWrite {
  readonly titleFa: string;
  readonly bodyFa: string;
  readonly callToActionLabelFa?: string | null;
  readonly callToActionTarget?: string | null;
  readonly isVisible: boolean;
}

export interface ManagedContentEntity extends ManagedContentWrite {
  readonly id: string;
  readonly slotKey: string;
  readonly version: number;
}

export interface AdministratorAccountDto {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly isActive: boolean;
  readonly isOwner: boolean;
  readonly version: number;
}
