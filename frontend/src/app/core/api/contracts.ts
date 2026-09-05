export interface Page<T>{readonly items:ReadonlyArray<T>;readonly page:number;readonly pageSize:number;readonly total:number}
export interface CategorySummary{readonly id:string;readonly slug:string;readonly nameFa:string;readonly descriptionFa?:string;readonly productCount:number}
export interface ApiProductSummary{readonly id:string;readonly slug:string;readonly nameFa:string;readonly mazinoorProductCode?:string;readonly category:string;readonly shortDescriptionFa:string;readonly primaryImage?:{readonly url:string;readonly altTextFa:string}}
export interface ProblemDetails{readonly type:string;readonly title:string;readonly status:number;readonly detail?:string;readonly correlationId?:string;readonly errors?:Readonly<Record<string,ReadonlyArray<string>>>}
