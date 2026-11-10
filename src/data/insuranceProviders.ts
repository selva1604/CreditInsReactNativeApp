import { InsuranceProvider, InsuranceType } from '../types';

/*
 * Sample list of insurers. In production, load this from your backend so the
 * list matches the insurers you actually have partnerships / APIs with.
 */

const HEALTH_PROVIDERS: InsuranceProvider[] = [
  { id: 'star-health', name: 'Star Health Insurance', description: 'Individual & family health plans', color: '#2563EB' },
  { id: 'niva-bupa', name: 'Niva Bupa Health Insurance', description: 'Individual & family health plans', color: '#0D9488' },
  { id: 'care-health', name: 'Care Health Insurance', description: 'Individual & family health plans', color: '#16A34A' },
  { id: 'hdfc-ergo-h', name: 'HDFC ERGO Health', description: 'Health & top-up plans', color: '#DC2626' },
  { id: 'icici-lombard-h', name: 'ICICI Lombard Health', description: 'Health & top-up plans', color: '#EA580C' },
  { id: 'aditya-birla-h', name: 'Aditya Birla Health Insurance', description: 'Health & wellness plans', color: '#B91C1C' },
  { id: 'manipalcigna', name: 'ManipalCigna Health Insurance', description: 'Individual & family health plans', color: '#1D4ED8' },
  { id: 'tata-aig-h', name: 'Tata AIG Health', description: 'Health & critical illness plans', color: '#1E40AF' },
  { id: 'sbi-general-h', name: 'SBI General Health', description: 'Health & family floater plans', color: '#0369A1' },
  { id: 'new-india-h', name: 'New India Assurance Health', description: 'Public sector health plans', color: '#7C3AED' },
];

const VEHICLE_PROVIDERS: InsuranceProvider[] = [
  { id: 'icici-lombard-v', name: 'ICICI Lombard Motor', description: 'Car & two-wheeler insurance', color: '#EA580C' },
  { id: 'hdfc-ergo-v', name: 'HDFC ERGO Motor', description: 'Car & two-wheeler insurance', color: '#DC2626' },
  { id: 'tata-aig-v', name: 'Tata AIG Motor', description: 'Car & two-wheeler insurance', color: '#1E40AF' },
  { id: 'digit', name: 'Go Digit General Insurance', description: 'Car & two-wheeler insurance', color: '#111827' },
  { id: 'sbi-general-v', name: 'SBI General Motor', description: 'Car & two-wheeler insurance', color: '#0369A1' },
  { id: 'iffco-tokio', name: 'IFFCO Tokio General Insurance', description: 'Car & two-wheeler insurance', color: '#15803D' },
  { id: 'reliance-general', name: 'Reliance General Insurance', description: 'Car & two-wheeler insurance', color: '#B91C1C' },
  { id: 'new-india-v', name: 'New India Assurance Motor', description: 'Public sector motor insurance', color: '#7C3AED' },
  { id: 'united-india', name: 'United India Insurance', description: 'Public sector motor insurance', color: '#9333EA' },
  { id: 'national-ins', name: 'National Insurance', description: 'Public sector motor insurance', color: '#0F766E' },
  { id: 'oriental-ins', name: 'The Oriental Insurance', description: 'Public sector motor insurance', color: '#A16207' },
];

export function getInsuranceProviders(type: InsuranceType): InsuranceProvider[] {
  return type === 'health' ? HEALTH_PROVIDERS : VEHICLE_PROVIDERS;
}
