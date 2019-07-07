import { createElement } from 'react';
import { render } from 'react-dom';
import { App } from './App';
import { loadCSS } from './utils';

render(createElement(App, {}, null), document.getElementById('oraclemarketcap'));
// loadCSS('https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.4.10/dialog-polyfill.min.css');
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/2.10.0/github-markdown.min.css');
loadCSS('https://fonts.googleapis.com/css?family=Open+Sans:400,600,800');