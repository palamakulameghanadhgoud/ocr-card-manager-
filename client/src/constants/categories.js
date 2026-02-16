/**
 * Fallback categories when API/MongoDB is unavailable.
 * Sorted alphabetically by label.
 */
export const DEFAULT_CATEGORIES = [
  { _id: 'ind-education', type: 'industry', value: 'education', label: 'Education' },
  { _id: 'ind-finance', type: 'industry', value: 'finance', label: 'Finance' },
  { _id: 'ind-healthcare', type: 'industry', value: 'healthcare', label: 'Healthcare' },
  { _id: 'ind-retail', type: 'industry', value: 'retail', label: 'Retail' },
  { _id: 'ind-technology', type: 'industry', value: 'technology', label: 'Technology' },
  { _id: 'rel-client', type: 'relationshipType', value: 'client', label: 'Client' },
  { _id: 'rel-colleague', type: 'relationshipType', value: 'colleague', label: 'Colleague' },
  { _id: 'rel-partner', type: 'relationshipType', value: 'partner', label: 'Partner' },
  { _id: 'rel-vendor', type: 'relationshipType', value: 'vendor', label: 'Vendor' },
  { _id: 'pri-high', type: 'priority', value: 'high', label: 'High' },
  { _id: 'pri-low', type: 'priority', value: 'low', label: 'Low' },
  { _id: 'pri-medium', type: 'priority', value: 'medium', label: 'Medium' },
];
