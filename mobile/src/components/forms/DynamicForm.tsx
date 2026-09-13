import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import type { HseFormAnswers, HseFormField, HseFormSchema } from '../../types/forms';
import { theme } from '../../theme';
import { FormField } from './FormField';

function requiredValid(field: HseFormField, value: unknown) {
  if (!field.required) return true;
  if (field.type === 'compliance') return ['complies','non_compliant','na'].includes(String(value));
  if (field.type === 'yes_no') return value === true || value === false || value === 'yes' || value === 'no';
  if (field.type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (field.type === 'photo') return typeof value === 'string' && value.length > 0;
  if (field.type === 'repeater') return Array.isArray(value) && value.length > 0;
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

export function DynamicForm({ schema, initialAnswers = {}, submitLabel = 'Guardar y continuar', readOnly = false, onChange, onSubmit }: { schema: HseFormSchema; initialAnswers?: HseFormAnswers; submitLabel?: string; readOnly?: boolean; onChange?(answers: HseFormAnswers): void; onSubmit(answers: HseFormAnswers): void | Promise<void> }) {
  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<HseFormAnswers>({ defaultValues: initialAnswers });
  useEffect(() => {
    if (!onChange) return;
    const subscription = watch(value => onChange(value as HseFormAnswers));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return <View style={styles.form}>
    {schema.description ? <Text style={styles.description}>{schema.description}</Text> : null}
    {schema.sections.map(section => <View key={section.id} style={styles.section}>
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{section.title}</Text>{section.description ? <Text style={styles.sectionDescription}>{section.description}</Text> : null}</View>
      {section.fields.map(field => <Controller key={field.id} name={field.id} control={control} rules={{ validate: value => requiredValid(field, value) || 'Este campo es obligatorio' }} render={({ field: controllerField }) => <View pointerEvents={readOnly ? 'none' : 'auto'}><FormField field={field} value={controllerField.value} onChange={controllerField.onChange} error={errors[field.id]?.message as string | undefined}/></View>}/>) }
    </View>)}
    {!readOnly ? <Pressable disabled={isSubmitting} onPress={handleSubmit(async answers => onSubmit(answers))} style={[styles.submit,isSubmitting&&styles.submitDisabled]}><Text style={styles.submitText}>{isSubmitting ? 'Guardando…' : submitLabel}</Text></Pressable> : null}
  </View>;
}

const styles=StyleSheet.create({form:{gap:16},description:{color:theme.colors.muted,lineHeight:19},section:{backgroundColor:'#fff',borderRadius:18,borderWidth:1,borderColor:theme.colors.line,padding:15,gap:16},sectionHead:{gap:3},sectionTitle:{fontSize:17,fontWeight:'900',color:theme.colors.ink},sectionDescription:{fontSize:11,color:theme.colors.muted,lineHeight:16},submit:{backgroundColor:theme.colors.primary,borderRadius:14,minHeight:50,alignItems:'center',justifyContent:'center'},submitDisabled:{opacity:.55},submitText:{color:'#fff',fontWeight:'900',fontSize:14}});
