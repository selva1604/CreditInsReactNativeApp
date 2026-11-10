import React from 'react';
import { Wallet } from '../../types';
import { formatCurrency } from '../../utils/format';
import RadioRow from './RadioRow';

interface Props {
  wallets: Wallet[];
  selectedId: string | null;
  amount: number;
  onSelect: (id: string) => void;
}

export default function WalletPicker({ wallets, selectedId, amount, onSelect }: Props) {
  return (
    <>
      {wallets.map((w) => {
        const insufficient = w.balance < amount;
        return (
          <RadioRow
            key={w.id}
            label={w.name}
            sublabel={
              insufficient
                ? `Balance ${formatCurrency(w.balance)} · Insufficient balance`
                : `Balance ${formatCurrency(w.balance)}`
            }
            selected={selectedId === w.id}
            disabled={insufficient}
            onPress={() => onSelect(w.id)}
          />
        );
      })}
    </>
  );
}
