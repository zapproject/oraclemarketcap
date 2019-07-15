import * as React from 'react';

interface Props {
	onClose: () => void,
	html: string,
};

export const Dialog = React.memo(({html, onClose}: Props) => (
	<div id="dialog">
		<a className="close" onClick={onClose}>&times;</a>
		<div className="markdown-body" dangerouslySetInnerHTML={{__html: html}}></div>
	</div>
));