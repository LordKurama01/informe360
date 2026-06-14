export const appSettings = {
  projectName: 'Informe360 AI Agent',
  adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'prestify55@gmail.com',
  demoMode: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true'
} as const;
