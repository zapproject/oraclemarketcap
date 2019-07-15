import * as React from 'react';

interface Props {
  pages: Array<string | number>;
  currentPage: string | number;
  search: string;
}
export const ProvidersPagination = React.memo(({pages, currentPage, search}: Props) => (
  <ul className="oracles-pagination">
    {pages.map((page, index) => <li key={'' + index + page} className={page === currentPage ? 'active' : ''}>
      <a href={`#search=${search};page=${page}`}>{page}</a>
    </li>)}
  </ul>
));