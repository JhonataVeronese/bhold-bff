/** Normaliza CNPJ para até 14 dígitos (apenas números). */
export function normalizeCnpj(input: unknown): string {
	const s = typeof input === 'string' ? input.trim() : typeof input === 'number' ? String(input) : '';
	return s.replace(/\D/g, '').slice(0, 14);
}
