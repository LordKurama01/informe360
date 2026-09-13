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
    {schema.description ? <View style={styles.descriptionBox}><View style={styles.descriptionDot}/><Text style={styles.description}>{schema.description}</Text></View> : null}
    {schema.sections.map((section, sectionIndex) => <View key={section.id} style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>{sectionIndex + 1}</Text></View>
        <View style={styles.sectionHeadCopy}><Text style={styles.sectionTitle}>{section.title}</Text>{section.description ? <Text style={styles.sectionDescription}>{section.description}</Text> : null}</View>
      </View>
      <View style={styles.fields}>{section.fields.map(field => <Controller key={field.id} name={field.id} control={control} rules={{ validate: value => requiredValid(field, value) || 'Este campo es obligatorio' }} render={({ field: controllerField }) => <View pointerEvents={readOnly ? 'none' : 'auto'}><FormField field={field} value={controllerField.value} onChange={controllerField.onChange} error={errors[field.id]?.message as string | undefined}/></View>}/>)}</View>
    </View>)}
    {!readOnly ? <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={handleSubmit(async answers => onSubmit(answers))} style={({ pressed }) => [styles.submit, (isSubmitting || pressed) && styles.submitDisabled]}><Text style={styles.submitText}>{isSubmitting ? 'Guardando…' : submitLabel}</Text></Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing.md },
  descriptionBox: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm, backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.md, padding: theme.spacing.md },
  descriptionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.primary, marginTop: 5 },
  description: { flex: 1, color: theme.colors.muted, lineHeight: 18, fontSize: 11 },
  section: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.lg, gap: theme.spacing.lg, ...theme.shadow.card },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  sectionNumber: { width: 30, height: 30, borderRadius: 10, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sectionNumberText: { color: theme.colors.primary, fontSize: 11, fontWeight: '900' },
  sectionHeadCopy: { flex: 1, gap: 3 },
  sectionTitle: { fontSize: 17, lineHeight: 21, fontWeight: '900', color: theme.colors.ink },
  sectionDescription: { fontSize: 11, color: theme.colors.muted, lineHeight: 16 },
  fields: { gap: theme.spacing.lg },
  submit: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, minHeight: 54, alignItems: 'center', justifyContent: 'center', ...theme.shadow.raised },
  submitDisabled: { opacity: 0.58 },
  submitText: { color: theme.colors.white, fontWeight: '900', fontSize: 14 },
});
