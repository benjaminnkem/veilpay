import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/errors';

export const notify = {
  success(message: string, description?: string) {
    return toast.success(message, { description });
  },
  error(error: unknown, fallback = 'Something went wrong') {
    const message =
      typeof error === 'string' ? error : getErrorMessage(error) || fallback;
    return toast.error(message);
  },
  info(message: string, description?: string) {
    return toast.info(message, { description });
  },
  warning(message: string, description?: string) {
    return toast.warning(message, { description });
  },
  loading(message: string) {
    return toast.loading(message);
  },
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error?: string | ((error: unknown) => string);
    }
  ) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: (error) =>
        typeof messages.error === 'function'
          ? messages.error(error)
          : messages.error ?? getErrorMessage(error),
    });
  },
};
