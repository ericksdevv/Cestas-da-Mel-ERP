import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, View, Text } from 'react-native';
import { erpApi } from '../../api/erp';
import { Basket } from '../../api/types';
import { Field, PrimaryButton, SelectField, ErrorNotice, Empty, uiStyles } from '../../components/ui';
import { errorMessage, number, parseNumber } from '../../utils/format';
import { themedStyles } from '../../theme/theme';

export function ProductionForm({ baskets, onSaved }: { baskets: Basket[]; onSaved(): Promise<void> }) {
  const [basketId, setBasketId] = useState(String(baskets.find(item => item.active)?.id ?? ''));
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  
  const selected = baskets.find(item => String(item.id) === basketId);
  const mutation = useMutation({ 
    mutationFn: () => erpApi.createProduction({ basketId: Number(basketId), quantity: parseNumber(quantity), producedAt: new Date().toISOString(), notes: notes.trim() }), 
    onSuccess: onSaved 
  });
  
  const submit = () => { 
    const amount=parseNumber(quantity); 
    if(!selected) return Alert.alert('Selecione um modelo'); 
    if(!Number.isInteger(amount)||amount<=0) return Alert.alert('Quantidade inválida','Informe uma quantidade inteira maior que zero.'); 
    if(amount>selected.maximumProducible) return Alert.alert('Componentes insuficientes',`É possível produzir no máximo ${number(selected.maximumProducible)} cesta(s).`); 
    mutation.mutate();    onSaved();
  };
  
  

  if(!baskets.length) return <Empty message="Cadastre um modelo de cesta primeiro."/>;
  
  return <><SelectField label="Modelo" value={basketId} options={baskets.filter((item) => item.active).map((item) => ({ value: String(item.id), label: item.name, detail: `${number(item.quantity)} pronta(s)` }))} onChange={setBasketId} />{selected?<View style={uiStyles.panel}><Text style={styles.stockName}>{selected.name}</Text><Text style={uiStyles.muted}>Prontas: {number(selected.quantity)} · máximo produzível agora: {number(selected.maximumProducible)}</Text></View>:null}<Field label="Quantidade a produzir" value={quantity} onChangeText={setQuantity} keyboardType="number-pad"/><Field label="Observações" value={notes} onChangeText={setNotes} multiline/>{mutation.error?<ErrorNotice message={errorMessage(mutation.error)}/>:null}<PrimaryButton title={mutation.isPending?'Produzindo...':'Confirmar produção'} onPress={submit} disabled={mutation.isPending}/></>;
}

const styles = themedStyles((colors) => ({
  stockName: { color: colors.ink, fontWeight: '700', fontSize: 18, marginBottom: 8 },
}));
