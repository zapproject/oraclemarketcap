import * as React from 'react';
import { Header } from './components/header/Header';

export class App extends React.PureComponent {
  render() {
    return (
      <React.Fragment>
        <Header />
      </React.Fragment>
    )
  }
}
