
import React from 'react';
import { CurrencyPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface CurrencyPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: CurrencyPropertyConfig) => void;
}

const COMMON_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

export function CurrencyPropertyConfigEditor({ config, onConfigChange }: CurrencyPropertyConfigEditorProps) {
  const currencyConfig = config as CurrencyPropertyConfig;

  const updateConfig = (updates: Partial<CurrencyPropertyConfig>) => {
    onConfigChange({ ...currencyConfig, ...updates });
  };

  const selectedCurrency = COMMON_CURRENCIES.find(c => c.code === currencyConfig.currency);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select value={currencyConfig.currency || 'USD'} onValueChange={(value) => {
          const currency = COMMON_CURRENCIES.find(c => c.code === value);
          updateConfig({ 
            currency: value,
            symbol: currency?.symbol 
          });
        }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_CURRENCIES.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name} ({currency.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="symbol">Currency Symbol</Label>
        <Input
          id="symbol"
          value={currencyConfig.symbol || selectedCurrency?.symbol || '$'}
          onChange={(e) => updateConfig({ symbol: e.target.value })}
          placeholder="$"
          className="w-20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="symbolPosition">Symbol Position</Label>
        <Select value={currencyConfig.symbolPosition || 'before'} onValueChange={(value) => updateConfig({ symbolPosition: value as 'before' | 'after' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="before">Before ($100)</SelectItem>
            <SelectItem value="after">After (100$)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="precision">Decimal Places</Label>
        <Select value={currencyConfig.precision?.toString() || '2'} onValueChange={(value) => updateConfig({ precision: parseInt(value) })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0 ($100)</SelectItem>
            <SelectItem value="2">2 ($100.00)</SelectItem>
            <SelectItem value="3">3 ($100.000)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="thousandsSeparator">Thousands Separator</Label>
          <Input
            id="thousandsSeparator"
            value={currencyConfig.thousandsSeparator || ''}
            onChange={(e) => updateConfig({ thousandsSeparator: e.target.value })}
            placeholder=","
            className="w-20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="decimalSeparator">Decimal Separator</Label>
          <Input
            id="decimalSeparator"
            value={currencyConfig.decimalSeparator || ''}
            onChange={(e) => updateConfig({ decimalSeparator: e.target.value })}
            placeholder="."
            className="w-20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultValue">Default Amount</Label>
        <Input
          id="defaultValue"
          type="number"
          min="0"
          step="0.01"
          value={currencyConfig.defaultValue ?? ''}
          onChange={(e) => updateConfig({ defaultValue: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="0.00"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={currencyConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={currencyConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
