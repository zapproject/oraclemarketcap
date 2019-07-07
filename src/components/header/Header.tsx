import * as React from 'react';
import { NetworkSelect } from './NetworkSelect';
import { Search } from './Search';
interface Props {
  search: string;
  netId: number;
  onNetworkChange: (netId: number) => void;
}
export const Header = React.memo(({netId, search, onNetworkChange}: Props) => {
  return (
    <header>
      <div id="logo">
        <img src="/assets/img/omc-header-logo.png" alt="Oracle Market Cap Logo" id="omc-header-logo" />
      </div>
      <NetworkSelect netId={netId} onSelect={onNetworkChange} />
      <Search search={search} />
    </header>
  );
});
