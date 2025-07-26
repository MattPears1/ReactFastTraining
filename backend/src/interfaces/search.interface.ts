export interface ISearchQuery {
  query: string;
  filters?: ISearchFilter[];
  facets?: string[];
  sort?: ISearchSort[];
  page?: number;
  limit?: number;
  highlight?: boolean;
  fuzzy?: boolean;
  boost?: ISearchBoost[];
}

export interface ISearchFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  IN = 'in',
  NOT_IN = 'not_in',
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists'
}

export interface ISearchSort {
  field: string;
  order: 'asc' | 'desc';
}

export interface ISearchBoost {
  field: string;
  weight: number;
}

export interface ISearchResult<T = any> {
  hits: ISearchHit<T>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: ISearchFacet[];
  suggestions?: string[];
  executionTime: number;
}

export interface ISearchHit<T = any> {
  id: string;
  score: number;
  source: T;
  highlights?: Record<string, string[]>;
}

export interface ISearchFacet {
  field: string;
  values: IFacetValue[];
}

export interface IFacetValue {
  value: string;
  count: number;
}

export interface ISearchIndex {
  name: string;
  fields: IIndexField[];
  settings?: IIndexSettings;
  mappings?: Record<string, any>;
}

export interface IIndexField {
  name: string;
  type: FieldType;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  facetable?: boolean;
  boost?: number;
  analyzer?: string;
}

export enum FieldType {
  TEXT = 'text',
  KEYWORD = 'keyword',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  GEO_POINT = 'geo_point',
  OBJECT = 'object',
  NESTED = 'nested'
}

export interface IIndexSettings {
  numberOfShards?: number;
  numberOfReplicas?: number;
  refreshInterval?: string;
  maxResultWindow?: number;
  analysis?: IAnalysisSettings;
}

export interface IAnalysisSettings {
  analyzers?: Record<string, any>;
  tokenizers?: Record<string, any>;
  filters?: Record<string, any>;
  charFilters?: Record<string, any>;
}

export interface ISearchProvider {
  index(indexName: string, documents: any[]): Promise<void>;
  update(indexName: string, id: string, document: any): Promise<void>;
  delete(indexName: string, id: string): Promise<void>;
  search<T>(indexName: string, query: ISearchQuery): Promise<ISearchResult<T>>;
  suggest(indexName: string, query: string, field: string): Promise<string[]>;
  createIndex(index: ISearchIndex): Promise<void>;
  deleteIndex(indexName: string): Promise<void>;
  reindex(sourceIndex: string, targetIndex: string): Promise<void>;
}

export interface ISearchAnalytics {
  query: string;
  results: number;
  clickedResults: string[];
  userId?: string;
  sessionId: string;
  timestamp: Date;
  executionTime: number;
  filters?: ISearchFilter[];
}

export interface ISearchSynonym {
  id: string;
  term: string;
  synonyms: string[];
  type: 'equivalent' | 'one_way';
  isActive: boolean;
}

export interface ISearchAutoComplete {
  query: string;
  suggestions: IAutoCompleteSuggestion[];
}

export interface IAutoCompleteSuggestion {
  text: string;
  score: number;
  payload?: any;
}