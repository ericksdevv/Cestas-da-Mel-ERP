import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert } from 'react-native';
import { erpApi } from '../../api/erp';
import { Field, PrimaryButton, ErrorNotice } from '../../components/ui';
import { errorMessage, parseNumber } from '../../utils/format';

export function ExpenseForm({ onDone }: { onDone(): void }) {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [observations, setObservations] = useState('');

  const mutation = useMutation({ 
    mutationFn: () => erpApi.createExpense({ 
      description: description.trim(), 
      category: category.trim(), 
      amount: parseNumber(amount), 
      observations: observations.trim(), 
      occurredAt: new Date().toISOString() 
    }), 
    onSuccess: () => { 
      onDone(); 
      void Promise.all(['expenses', 'transactions', 'balance', 'dashboard'].map((key) => queryClient.invalidateQueries({ queryKey: [key] }))); 
    } 
  });

  const submit = () => { 
    if (!description.trim() || !category.trim() || !Number.isFinite(parseNumber(amount)) || parseNumber(amount) <= 0) 
      return Alert.alert('Dados incompletos', 'Preencha descrição, categoria e um valor maior que zero.'); 
    mutation.mutate(); 
  };

  return (
    <>
      <Field label="Descrição" value={description} onChangeText={setDescription} placeholder="Ex.: Conta de energia" />
      <Field label="Categoria" value={category} onChangeText={setCategory} placeholder="Ex.: Utilidades" />
      <Field label="Valor" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Field label="Observações" value={observations} onChangeText={setObservations} multiline />
      
      {mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}
      <PrimaryButton title={mutation.isPending ? 'Registrando...' : 'Registrar gasto'} onPress={submit} disabled={mutation.isPending} />
    </>
  );
}
