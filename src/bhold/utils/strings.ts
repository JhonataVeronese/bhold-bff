export function str(v: unknown): string {
	if (typeof v === 'string') return v.trim();
	if (typeof v === 'number') return String(v);
	return '';
}

/** Id inteiro positivo (params, header ou JSON como número ou string numérica). */
export function parsePositiveInt(v: unknown): number | null {
	if (typeof v === 'number') {
		return Number.isInteger(v) && v > 0 && v <= Number.MAX_SAFE_INTEGER ? v : null;
	}
	if (typeof v === 'string') {
		const s = v.trim();
		if (!/^\d+$/.test(s)) return null;
		const n = Number(s);
		return n > 0 && n <= Number.MAX_SAFE_INTEGER ? n : null;
	}
	return null;
}

/** Slug para tenant: minúsculas, números e hífens (ex.: subdomínio). */
export function normalizeSlug(v: unknown): string {
	const raw = str(v).toLowerCase().replace(/\s+/g, '-');
	const cleaned = raw
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
	return cleaned;
}
