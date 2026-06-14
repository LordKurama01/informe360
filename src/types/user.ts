export type UserStatus = 'lead' | 'registrado' | 'pendiente_pago' | 'fundador_activo' | 'regular_activo' | 'vencido' | 'cancelado' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  fullName?: string;
  companyName?: string;
  province?: string;
  status: UserStatus;
  planId?: string;
  createdAt: string;
  lastLoginAt?: string;
}
