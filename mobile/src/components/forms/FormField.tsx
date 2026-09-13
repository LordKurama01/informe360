import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { HseFormField, HseLeafField } from '../../types/forms';
import { theme } from '../../theme';
import { RiskMatrixField } from './RiskMatrixField';

export function FormField({ field, value, onChange, error }: { field: HseFormField; value: unknown; onChange(value: unknown): void; error?: string }) {
  return <View style={styles.block}>
    <Text style={styles.label}>{field.label}{field.required ? <Text style={styles.required}> *</Text> : null}</Text>
    {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
    <FieldControl field={field} value={value} onChange={onChange}/>
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>;
}

function FieldControl({ field, value, onChange }: { field: HseFormField; value: unknown; onChange(value: unknown): void }) {
  if (field.type === 'text' || field.type === 'date' || field.type === 'number') {
    return <TextInput value={value === null || value === undefined ? '' : String(value)} onChangeText={text => onChange(field.type === 'number' ? (text === '' ? null : Number(text.replace(',', '.'))) : text)} placeholder={field.type === 'date' ? 'DD/MM/AAAA' : 'Escribir…'} keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'} multiline={field.type === 'text' && field.multiline} style={[styles.input, field.type === 'text' && field.multiline ? styles.multiline : null]}/>;
  }
  if (field.type === 'yes_no') return <ChoiceRow options={[['yes','Sí'],['no','No']]} value={value} onChange={onChange}/>;
  if (field.type === 'compliance') return <ChoiceRow options={[['complies','Cumple'],['non_compliant','No cumple'],['na','N/A']]} value={value} onChange={onChange}/>;
  if (field.type === 'select') return <View style={styles.wrap}>{field.options.map(option => <Choice key={option.value} label={option.label} active={value === option.value} onPress={() => onChange(option.value)}/>)}</View>;
  if (field.type === 'photo') return <PhotoField value={value} onChange={onChange}/>;
  if (field.type === 'risk_matrix') return <RiskMatrixField value={value as never} max={Math.min(field.likelihoodScale || 5, field.consequenceScale || 5)} onChange={onChange}/>;
  if (field.type === 'repeater') return <RepeaterField fields={field.fields} value={value} onChange={onChange}/>;
  return null;
}

function ChoiceRow({ options, value, onChange }: { options: Array<[string,string]>; value: unknown; onChange(value: unknown): void }) { return <View style={styles.row}>{options.map(([key,label]) => <Choice key={key} label={label} active={value === key || (key === 'yes' && value === true) || (key === 'no' && value === false)} onPress={() => onChange(key)}/>)}</View>; }
function Choice({ label, active, onPress }: { label: string; active: boolean; onPress(): void }) { return <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceOn]}><Text style={[styles.choiceText, active && styles.choiceTextOn]}>{label}</Text></Pressable>; }

function PhotoField({ value, onChange }: { value: unknown; onChange(value: unknown): void }) {
  const uri = typeof value === 'string' ? value : null;
  async function pick() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.65 });
    if (!result.canceled && result.assets[0]?.uri) onChange(result.assets[0].uri);
  }
  return <View style={styles.photoWrap}>{uri ? <Image source={{ uri }} style={styles.photo}/> : null}<Pressable onPress={() => void pick()} style={styles.photoButton}><Text style={styles.photoButtonText}>{uri ? 'Reemplazar foto' : '📷 Tomar foto'}</Text></Pressable></View>;
}

function RepeaterField({ fields, value, onChange }: { fields: HseLeafField[]; value: unknown; onChange(value: unknown): void }) {
  const [expanded, setExpanded] = useState(0);
  const rows = Array.isArray(value) ? value as Record<string,unknown>[] : [];
  const add = () => { const next=[...rows,{}]; onChange(next); setExpanded(next.length-1); };
  const update = (rowIndex:number, fieldId:string, fieldValue:unknown) => onChange(rows.map((row,index)=>index===rowIndex?{...row,[fieldId]:fieldValue}:row));
  const remove = (rowIndex:number) => onChange(rows.filter((_,index)=>index!==rowIndex));
  return <View style={styles.repeater}>{rows.map((row,rowIndex)=><View key={rowIndex} style={styles.repeatCard}><Pressable onPress={()=>setExpanded(expanded===rowIndex?-1:rowIndex)} style={styles.repeatHeader}><Text style={styles.repeatTitle}>Paso {rowIndex+1}</Text><Text>{expanded===rowIndex?'−':'+'}</Text></Pressable>{expanded===rowIndex?<View style={styles.repeatBody}>{fields.map(nested=><FormField key={nested.id} field={nested} value={row[nested.id]} onChange={next=>update(rowIndex,nested.id,next)}/>)}<Pressable onPress={()=>remove(rowIndex)}><Text style={styles.remove}>Eliminar paso</Text></Pressable></View>:null}</View>)}<Pressable onPress={add} style={styles.add}><Text style={styles.addText}>+ Agregar paso</Text></Pressable></View>;
}

const styles=StyleSheet.create({block:{gap:6},label:{fontWeight:'900',color:theme.colors.ink,fontSize:13},required:{color:theme.colors.danger},help:{fontSize:11,color:theme.colors.muted,lineHeight:16},input:{backgroundColor:'#fff',borderWidth:1,borderColor:theme.colors.line,borderRadius:12,paddingHorizontal:12,paddingVertical:11,color:theme.colors.ink},multiline:{minHeight:90,textAlignVertical:'top'},row:{flexDirection:'row',gap:7},wrap:{flexDirection:'row',flexWrap:'wrap',gap:7},choice:{flex:1,minWidth:85,paddingVertical:11,paddingHorizontal:10,borderRadius:11,borderWidth:1,borderColor:theme.colors.line,alignItems:'center',backgroundColor:'#fff'},choiceOn:{backgroundColor:theme.colors.ink,borderColor:theme.colors.ink},choiceText:{fontWeight:'800',fontSize:12,color:theme.colors.ink},choiceTextOn:{color:'#fff'},error:{color:theme.colors.danger,fontSize:11,fontWeight:'700'},photoWrap:{gap:8},photo:{height:180,borderRadius:14,backgroundColor:'#E2E8F0'},photoButton:{borderRadius:12,borderWidth:1,borderColor:theme.colors.primary,padding:11,alignItems:'center'},photoButtonText:{color:theme.colors.primary,fontWeight:'900'},repeater:{gap:9},repeatCard:{borderWidth:1,borderColor:theme.colors.line,borderRadius:14,overflow:'hidden'},repeatHeader:{padding:12,flexDirection:'row',justifyContent:'space-between',backgroundColor:'#F8FAFC'},repeatTitle:{fontWeight:'900',color:theme.colors.ink},repeatBody:{padding:12,gap:14},remove:{color:theme.colors.danger,fontWeight:'800',fontSize:12},add:{padding:11,borderWidth:1,borderStyle:'dashed',borderColor:theme.colors.primary,borderRadius:12,alignItems:'center'},addText:{color:theme.colors.primary,fontWeight:'900'}});
