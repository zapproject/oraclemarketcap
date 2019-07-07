import * as React from 'react';
import { NetworkSelect } from './NetworkSelect';
import { Search } from './Search';
export const Header = () => {
  return (
    <header>
      <div id="logo">
        <img src="/assets/img/omc-header-logo.png" alt="Oracle Market Cap Logo" id="omc-header-logo" />
      </div>
      <NetworkSelect networkProvider={network} onSelect={setNetwork} />
      <Search />
    </header>
  );
};
