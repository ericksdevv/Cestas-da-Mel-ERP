import { useMutation, useQueryClient } from '@tanstack/react-query';
import { erpApi, HistoryType } from '../api/erp';
import { confirmAction } from '../utils/confirm';

export function useClearHistory(type: HistoryType, label: string, queryKeys: string[]) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => erpApi.clearHistory(type),
    onSuccess: async () => {
      await Promise.all(queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });

  const requestClear = () => confirmAction(
    `Limpar ${label}?`,
    'Os registros anteriores deixarão de aparecer. O estoque e o valor atual do caixa serão preservados.',
    () => mutation.mutate(),
  );

  return { requestClear, clearing: mutation.isPending, error: mutation.error };
}
