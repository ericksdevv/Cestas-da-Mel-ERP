import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { erpApi } from '../api/erp';
import { ReceiptAnalysis, ReceiptImportConfirmation, ReceiptItemSuggestion, UnitOfMeasure } from '../api/types';
import { chooseReceiptPhoto, PickedImage, takeReceiptPhoto } from '../native/imagePicker';
import { colors, themedStyles } from '../theme/theme';
import { errorMessage, money, parseNumber, unitLabels } from '../utils/format';
import { ErrorNotice, Field, Loading, PrimaryButton, SecondaryButton, SelectField } from './ui';

type EditableItem = Omit<ReceiptItemSuggestion, 'quantity' | 'contentQuantity' | 'unitCost' | 'subtotal'> & {
  quantity: string; contentQuantity: string; unitCost: string; salePrice: string; reference: string;
};
const units: UnitOfMeasure[] = ['UNIT','KG','G','L','ML','M','CM','PACKAGE','BOX'];

export function ReceiptImportForm({ onDone }: { onDone(): void }) {
  const queryClient=useQueryClient();
  const products=useQuery({queryKey:['products'],queryFn:erpApi.products});
  const materials=useQuery({queryKey:['materials'],queryFn:erpApi.materials});
  const [analysis,setAnalysis]=useState<ReceiptAnalysis|null>(null);
  const [establishment,setEstablishment]=useState('');
  const [date,setDate]=useState('');
  const [observations,setObservations]=useState('');
  const [items,setItems]=useState<EditableItem[]>([]);

  const analyze=useMutation({mutationFn:async(photo:PickedImage)=>{const form=new FormData();if(photo.file)form.append('file',photo.file,photo.fileName);else form.append('file',{uri:photo.uri,name:photo.fileName,type:photo.mimeType} as unknown as Blob);return erpApi.analyzeReceipt(form);},onSuccess:(result)=>{setAnalysis(result);setEstablishment(result.establishment);setDate((result.purchasedAt||new Date().toISOString()).slice(0,10));setItems(result.items.map(item=>({...item,quantity:String(item.quantity),contentQuantity:item.contentQuantity?String(item.contentQuantity):'',unitCost:String(item.unitCost),salePrice:'0',reference:item.matchedReferenceId?String(item.matchedReferenceId):'new'})));}});
  const confirm=useMutation({mutationFn:(input:ReceiptImportConfirmation)=>erpApi.confirmReceiptImport(input),onSuccess:()=>{void Promise.all(['purchases','products','materials','categories','dashboard','transactions','balance','alerts','stock-movements','material-movements'].map(key=>queryClient.invalidateQueries({queryKey:[key]})));Alert.alert('Nota importada','A compra, o estoque, os gastos e o caixa foram atualizados.');onDone();}});

  const pick=async(camera:boolean)=>{try{const photo=camera?await takeReceiptPhoto():await chooseReceiptPhoto();if(photo)analyze.mutate(photo);}catch(cause){Alert.alert('Não foi possível abrir a imagem',errorMessage(cause));}};
  const update=(index:number,values:Partial<EditableItem>)=>setItems(current=>current.map((item,itemIndex)=>itemIndex===index?{...item,...values}:item));
  const remove=(index:number)=>setItems(current=>current.filter((_,itemIndex)=>itemIndex!==index));
  const total=useMemo(()=>items.reduce((sum,item)=>sum+(parseNumber(item.quantity)||0)*(parseNumber(item.unitCost)||0),0),[items]);

  const submit=()=>{
    if(!establishment.trim())return Alert.alert('Estabelecimento obrigatório');
    if(!items.length)return Alert.alert('Nenhum item','Mantenha ao menos um item para importar.');
    const payloadItems=items.map(item=>({type:item.suggestedType,referenceId:item.reference==='new'?undefined:Number(item.reference),name:item.name.trim(),categoryName:item.categoryName.trim(),quantity:parseNumber(item.quantity),unit:item.suggestedType==='PRODUCT'?'UNIT' as const:item.inventoryUnit,contentQuantity:item.contentQuantity.trim()?parseNumber(item.contentQuantity):undefined,contentUnit:item.contentQuantity.trim()?item.contentUnit:undefined,unitCost:parseNumber(item.unitCost),salePrice:parseNumber(item.salePrice)}));
    if(payloadItems.some(item=>!item.name||!Number.isFinite(item.quantity)||item.quantity<=0||!Number.isFinite(item.unitCost)||item.unitCost<0||item.contentQuantity!==undefined&&(!Number.isFinite(item.contentQuantity)||item.contentQuantity<=0)))return Alert.alert('Revise os itens','Nome, quantidade, conteúdo e custos devem estar corretos.');
    confirm.mutate({establishment:establishment.trim(),purchasedAt:date?`${date}T12:00:00Z`:undefined,observations:observations.trim(),receiptAccessKey:analysis?.accessKey,items:payloadItems});
  };

  if(analyze.isPending)return <View style={styles.loading}><Loading/><Text style={styles.loadingText}>Lendo estabelecimento, produtos, quantidades e valores. A IA gratuita pode levar ate alguns minutos.</Text></View>;
  if(!analysis)return <View style={styles.start}><View style={styles.aiMark}><Ionicons name="sparkles" size={30} color={colors.honey}/></View><Text style={styles.title}>Importar uma nota</Text><Text style={styles.description}>Fotografe a nota inteira, sem sombras e com os valores legíveis. Você poderá revisar tudo antes de salvar.</Text>{analyze.error?<ErrorNotice message={errorMessage(analyze.error)}/>:null}<PrimaryButton title="Fotografar nota" icon="camera-outline" onPress={()=>void pick(true)}/><SecondaryButton title="Escolher da galeria" icon="images-outline" onPress={()=>void pick(false)}/></View>;

  return <>
    <View style={styles.summary}><View><Text style={styles.summaryLabel}>Total identificado</Text><Text style={styles.summaryTotal}>{money(total)}</Text></View><View style={styles.confidence}><Ionicons name="scan-outline" size={18} color={colors.cyan}/><Text style={styles.confidenceText}>{items.length} itens</Text></View></View>
    {analysis.warnings.length?<View style={styles.warning}><Ionicons name="alert-circle-outline" size={20} color={colors.honey}/><View style={styles.warningBody}>{analysis.warnings.map((warning,index)=><Text key={index} style={styles.warningText}>• {warning}</Text>)}</View></View>:null}
    <Field label="Estabelecimento" value={establishment} onChangeText={setEstablishment}/><Field label="Data da compra" value={date} onChangeText={setDate} placeholder="AAAA-MM-DD"/>
    <Text style={styles.sectionTitle}>Confira os itens</Text>
    {items.map((item,index)=><ReceiptItemEditor key={`${item.index}-${index}`} item={item} index={index} products={products.data??[]} materials={materials.data??[]} update={update} remove={remove}/>) }
    <Field label="Observações" value={observations} onChangeText={setObservations} multiline placeholder="Opcional"/>
    {confirm.error?<ErrorNotice message={errorMessage(confirm.error)}/>:null}
    <PrimaryButton title={confirm.isPending?'Salvando…':`Confirmar importação · ${money(total)}`} icon="checkmark-circle-outline" onPress={submit} disabled={confirm.isPending}/>
    <SecondaryButton title="Ler outra foto" icon="camera-reverse-outline" onPress={()=>setAnalysis(null)}/>
  </>;
}

function ReceiptItemEditor({item,index,products,materials,update,remove}:{item:EditableItem;index:number;products:Awaited<ReturnType<typeof erpApi.products>>;materials:Awaited<ReturnType<typeof erpApi.materials>>;update(index:number,values:Partial<EditableItem>):void;remove(index:number):void}){
  const catalog=item.suggestedType==='PRODUCT'?products:materials;
  const isNew=item.reference==='new';
  const referenceOptions=[{value:'new',label:'Cadastrar como novo',detail:item.categoryName||'Categoria sugerida'},...catalog.filter(value=>value.active).map(value=>({value:String(value.id),label:value.name,detail:`Estoque atual: ${value.quantity} ${unitLabels[value.unit]}`}))];
  return <View style={styles.itemCard}><View style={styles.itemHead}><View style={styles.itemNumber}><Text style={styles.itemNumberText}>{index+1}</Text></View><View style={styles.itemHeading}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemMeta}>{Math.round(item.confidence*100)}% de confiança{item.barcode?` · ${item.barcode}`:''}</Text></View><Pressable onPress={()=>remove(index)} accessibilityLabel="Remover item" style={styles.remove}><Ionicons name="trash-outline" size={18} color={colors.red}/></Pressable></View>
    <SelectField label="Tipo" value={item.suggestedType} options={[{value:'PRODUCT',label:'Produto para venda'},{value:'MATERIAL',label:'Material de produção'}]} onChange={value=>update(index,{suggestedType:value as 'PRODUCT'|'MATERIAL',reference:'new',inventoryUnit:value==='PRODUCT'?'UNIT':item.inventoryUnit})}/>
    <SelectField label="Vincular ao estoque" value={item.reference} options={referenceOptions} onChange={reference=>update(index,{reference})}/>
    {isNew?<><Field label="Nome" value={item.name} onChangeText={name=>update(index,{name})}/><Field label="Categoria" value={item.categoryName} onChangeText={categoryName=>update(index,{categoryName})}/></>:null}
    <View style={styles.fields}><View style={styles.field}><Field label="Quantidade" value={item.quantity} onChangeText={quantity=>update(index,{quantity})} keyboardType="decimal-pad"/></View><View style={styles.field}><Field label="Custo unitário" value={item.unitCost} onChangeText={unitCost=>update(index,{unitCost})} keyboardType="decimal-pad"/></View></View>
    {item.suggestedType==='MATERIAL'?<SelectField label="Unidade do estoque" value={item.inventoryUnit} options={units.map(unit=>({value:unit,label:unitLabels[unit]}))} onChange={inventoryUnit=>update(index,{inventoryUnit:inventoryUnit as UnitOfMeasure})}/>:null}
    {isNew?<><View style={styles.fields}><View style={styles.field}><Field label="Conteúdo da embalagem" value={item.contentQuantity} onChangeText={contentQuantity=>update(index,{contentQuantity,contentUnit:item.contentUnit??'G'})} keyboardType="decimal-pad" placeholder="Opcional"/></View><View style={styles.field}><SelectField label="Unidade do conteúdo" value={item.contentUnit} options={units.map(unit=>({value:unit,label:unitLabels[unit]}))} onChange={contentUnit=>update(index,{contentUnit:contentUnit as UnitOfMeasure})}/></View></View>{item.suggestedType==='PRODUCT'?<Field label="Preço de venda" value={item.salePrice} onChangeText={salePrice=>update(index,{salePrice})} keyboardType="decimal-pad"/>:null}</>:null}
  </View>;
}

const styles=themedStyles(colors=>({
  start:{gap:14,alignItems:'stretch',paddingVertical:10},aiMark:{width:64,height:64,borderRadius:22,alignSelf:'center',alignItems:'center',justifyContent:'center',backgroundColor:colors.cocoa,borderWidth:1,borderColor:colors.honey},title:{color:colors.ink,fontSize:23,fontWeight:'800',textAlign:'center'},description:{color:colors.muted,textAlign:'center',lineHeight:21,marginBottom:6},loading:{minHeight:300,justifyContent:'center'},loadingText:{color:colors.muted,textAlign:'center',marginTop:-20},summary:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderRadius:18,backgroundColor:colors.cyanSoft,borderWidth:1,borderColor:colors.cyan},summaryLabel:{color:colors.muted,fontSize:12},summaryTotal:{color:colors.ink,fontSize:24,fontWeight:'800',marginTop:3},confidence:{flexDirection:'row',alignItems:'center',gap:6},confidenceText:{color:colors.cyan,fontWeight:'700'},warning:{flexDirection:'row',gap:10,padding:13,borderRadius:14,backgroundColor:colors.cocoa,borderWidth:1,borderColor:colors.honey},warningBody:{flex:1,gap:3},warningText:{color:colors.ink,fontSize:12},sectionTitle:{color:colors.ink,fontWeight:'800',fontSize:18,marginTop:4},itemCard:{gap:12,padding:14,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceGlass},itemHead:{flexDirection:'row',alignItems:'center',gap:10},itemNumber:{width:34,height:34,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:colors.cyanSoft},itemNumberText:{color:colors.cyan,fontWeight:'800'},itemHeading:{flex:1},itemName:{color:colors.ink,fontWeight:'700'},itemMeta:{color:colors.muted,fontSize:11,marginTop:2},remove:{width:36,height:36,alignItems:'center',justifyContent:'center'},fields:{flexDirection:'row',gap:9,alignItems:'flex-start'},field:{flex:1},
}));
