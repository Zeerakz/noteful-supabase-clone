
import React from 'react';

interface GlyphProps {
  className?: string;
}

// Base glyph component with consistent sizing and styling
const BaseGlyph: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    className={`inline-block ${className}`}
    style={{ strokeWidth: 1.2 }}
  >
    {children}
  </svg>
);

// Title/Text - A minimal quote mark
export const TitleGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <path
      d="M3 4.5L3 7.5M9 4.5L9 7.5M2 3L4 3M8 3L10 3"
      stroke="currentColor"
      strokeLinecap="round"
      fill="none"
    />
  </BaseGlyph>
);

// Date - A minimal calendar grid
export const DateGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <rect
      x="2"
      y="3"
      width="8"
      height="7"
      rx="1"
      stroke="currentColor"
      fill="none"
    />
    <path
      d="M2 5.5L10 5.5M5.5 5.5L5.5 10M7.5 5.5L7.5 10"
      stroke="currentColor"
      strokeLinecap="round"
    />
    <circle cx="4" cy="1.5" r="0.5" fill="currentColor" />
    <circle cx="8" cy="1.5" r="0.5" fill="currentColor" />
    <path d="M4 1.5L4 3M8 1.5L8 3" stroke="currentColor" strokeLinecap="round" />
  </BaseGlyph>
);

// Status - A minimal progress indicator
export const StatusGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <circle
      cx="6"
      cy="6"
      r="4"
      stroke="currentColor"
      fill="none"
    />
    <path
      d="M6 2A4 4 0 0 1 6 6"
      stroke="currentColor"
      strokeLinecap="round"
      fill="none"
      strokeWidth="1.5"
    />
  </BaseGlyph>
);

// Team Members/People - A minimal person silhouette
export const PeopleGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <circle
      cx="6"
      cy="4"
      r="1.5"
      stroke="currentColor"
      fill="none"
    />
    <path
      d="M3 10C3 8.5 4.3 7.5 6 7.5C7.7 7.5 9 8.5 9 10"
      stroke="currentColor"
      strokeLinecap="round"
      fill="none"
    />
  </BaseGlyph>
);

// Select/Options - A minimal dropdown indicator
export const SelectGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <rect
      x="2"
      y="4"
      width="8"
      height="4"
      rx="1"
      stroke="currentColor"
      fill="none"
    />
    <path
      d="M4 6L6 7L8 6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </BaseGlyph>
);

// Number - A minimal hash/number symbol
export const NumberGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <path
      d="M4 2L4 10M8 2L8 10M2 4.5L10 4.5M2 7.5L10 7.5"
      stroke="currentColor"
      strokeLinecap="round"
      fill="none"
    />
  </BaseGlyph>
);

// Checkbox - A minimal checkmark
export const CheckboxGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <rect
      x="2"
      y="2"
      width="8"
      height="8"
      rx="1.5"
      stroke="currentColor"
      fill="none"
    />
    <path
      d="M4.5 6L5.5 7L7.5 5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </BaseGlyph>
);

// URL/Link - A minimal link symbol
export const UrlGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <path
      d="M5 7L7 5M4 5L5 4C5.5 3.5 6.5 3.5 7 4L8 5C8.5 5.5 8.5 6.5 8 7L7 8M8 7L7 8C6.5 8.5 5.5 8.5 5 8L4 7C3.5 6.5 3.5 5.5 4 5L5 4"
      stroke="currentColor"
      strokeLinecap="round"
      fill="none"
    />
  </BaseGlyph>
);

// Email - A minimal envelope
export const EmailGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <rect
      x="2"
      y="3"
      width="8"
      height="6"
      rx="1"
      stroke="currentColor"
      fill="none"
    />
    <path
      d="M2 4L6 7L10 4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </BaseGlyph>
);

// Phone - A minimal phone outline
export const PhoneGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <rect
      x="4"
      y="1"
      width="4"
      height="10"
      rx="1"
      stroke="currentColor"
      fill="none"
    />
    <path
      d="M5 2.5L7 2.5M6 9L6 9"
      stroke="currentColor"
      strokeLinecap="round"
      fill="none"
    />
  </BaseGlyph>
);

// Relation - A minimal connection symbol
export const RelationGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <circle cx="3" cy="6" r="1.5" stroke="currentColor" fill="none" />
    <circle cx="9" cy="6" r="1.5" stroke="currentColor" fill="none" />
    <path
      d="M4.5 6L7.5 6"
      stroke="currentColor"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M6.5 5L7.5 6L6.5 7"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </BaseGlyph>
);

// Formula - A minimal function symbol
export const FormulaGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <path
      d="M3 3L4 3C4.5 3 5 3.5 5 4L5 5C5 5.5 5.5 6 6 6C5.5 6 5 6.5 5 7L5 8C5 8.5 4.5 9 4 9L3 9"
      stroke="currentColor"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M9 3L8 3C7.5 3 7 3.5 7 4L7 5C7 5.5 6.5 6 6 6C6.5 6 7 6.5 7 7L7 8C7 8.5 7.5 9 8 9L9 9"
      stroke="currentColor"
      strokeLinecap="round"
      fill="none"
    />
  </BaseGlyph>
);

// Rollup - A minimal aggregation symbol
export const RollupGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <path
      d="M6 2L6 10M4 4L6 2L8 4M4 8L6 10L8 8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </BaseGlyph>
);

// File Attachment - A minimal document with clip
export const FileGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <path
      d="M3 2L3 10C3 10.5 3.5 11 4 11L8 11C8.5 11 9 10.5 9 10L9 4L7 2L3 2Z"
      stroke="currentColor"
      fill="none"
    />
    <path
      d="M7 2L7 4L9 4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle
      cx="8"
      cy="1"
      r="1"
      stroke="currentColor"
      fill="none"
      strokeWidth="0.8"
    />
  </BaseGlyph>
);

// Button - A minimal interactive element
export const ButtonGlyph: React.FC<GlyphProps> = ({ className }) => (
  <BaseGlyph className={className}>
    <rect
      x="2"
      y="4"
      width="8"
      height="4"
      rx="2"
      stroke="currentColor"
      fill="none"
    />
    <circle
      cx="6"
      cy="6"
      r="0.5"
      fill="currentColor"
    />
  </BaseGlyph>
);

// Map field types to their corresponding glyphs
export const getPropertyGlyph = (fieldType: string, fieldName?: string): React.FC<GlyphProps> => {
  // Check field name patterns first for more intelligent matching
  const fieldNameLower = fieldName?.toLowerCase() || '';
  
  // Smart field name matching
  if (fieldNameLower.includes('date') || fieldNameLower.includes('due') || fieldNameLower.includes('deadline')) {
    return DateGlyph;
  }
  if (fieldNameLower.includes('status') || fieldNameLower.includes('state')) {
    return StatusGlyph;
  }
  if (fieldNameLower.includes('team') || fieldNameLower.includes('member') || fieldNameLower.includes('assign') || fieldNameLower.includes('people')) {
    return PeopleGlyph;
  }
  if (fieldNameLower.includes('platform') || fieldNameLower.includes('channel')) {
    return SelectGlyph;
  }
  if (fieldNameLower.includes('link') || fieldNameLower.includes('url')) {
    return UrlGlyph;
  }
  
  // Fallback to field type mapping
  switch (fieldType) {
    case 'text':
      return fieldName?.toLowerCase() === 'title' ? TitleGlyph : TitleGlyph;
    case 'date':
      return DateGlyph;
    case 'status':
      return StatusGlyph;
    case 'people':
      return PeopleGlyph;
    case 'select':
    case 'multi_select':
      return SelectGlyph;
    case 'number':
      return NumberGlyph;
    case 'checkbox':
      return CheckboxGlyph;
    case 'url':
      return UrlGlyph;
    case 'email':
      return EmailGlyph;
    case 'phone':
      return PhoneGlyph;
    case 'relation':
      return RelationGlyph;
    case 'formula':
      return FormulaGlyph;
    case 'rollup':
      return RollupGlyph;
    case 'file_attachment':
      return FileGlyph;
    case 'button':
      return ButtonGlyph;
    default:
      return TitleGlyph;
  }
};
