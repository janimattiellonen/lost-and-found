import { createDiscFoundNotification } from '~/models/discFoundNotification.server';

/** Stores a "found a disc" report submitted from the public notify form. */
export async function reportDiscFound(form: FormData, courseName?: string) {
  await createDiscFoundNotification({
    courseName: courseName ?? form.get('courseName')?.toString() ?? null,
    contactName: form.get('contactName')?.toString() || null,
    contactPhone: form.get('contactPhone')?.toString() || null,
    contactEmail: form.get('contactEmail')?.toString() || null,
    message: form.get('message')?.toString() || null,
  });

  return { success: true };
}
