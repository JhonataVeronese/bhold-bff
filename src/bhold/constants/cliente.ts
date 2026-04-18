/** Documento fixo na base (equivalente ao CPF 000.000.000-00 — consumidor final). */
export const CONSUMIDOR_FINAL_CNPJ = '00000000000000';

export function isConsumidorFinalCnpj(cnpj: string): boolean {
	return cnpj === CONSUMIDOR_FINAL_CNPJ;
}
