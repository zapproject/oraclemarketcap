import { parseHash } from "zap-extras/lib/ui/shared/pagination/utils";

export function navigate(params) {
	const url = '#' + makeHash({...parseHash(), ...params});
	window.location.href = url;
}

export function makeHash(params, prevParams = {page: 1, search: '', expandedAddress: ''}) {
	const parts = [];
	parts.push('page=' + (params.page || prevParams.page || 1));
	parts.push('search=' + (params.search || prevParams.search || ''));
	parts.push('oracle=' + (params.expandedAddress || prevParams.expandedAddress || ''));
	return parts.join(';');
}

export function loadCSS(href) {
	const css = document.createElement('link');
	css.rel = 'stylesheet';
	css.href = href;
	document.getElementsByTagName('head')[0].appendChild(css);
}