import * as React from 'react';

/* export const ProviderAddress = React.memo(({address}: {address: string}) => (
	<a href={null} className="copy-icon" data-oracle={address}></a>
)); */

enum CopyEnum {
	'INIT',
	'IN_PROGRESS',
	'DONE',
};

export class ProviderAddress extends React.PureComponent<{address: string}, {copy: CopyEnum}> {
  state = {copy: CopyEnum.INIT};
  textareaRef: React.RefObject<HTMLTextAreaElement> = React.createRef();
  timeout: number;
  constructor(props) {
    super(props);
    this.handleCopy = this.handleCopy.bind(this);
  }
  componentWillUnmount() {
    if (this.timeout) clearTimeout(this.timeout);
  }
  handleCopy(e) {
    e.preventDefault();
    this.setState({ copy: CopyEnum.IN_PROGRESS }, () => {
      this.textareaRef.current.focus();
      this.textareaRef.current.select();
      document.execCommand('copy');
      this.setState({ copy: CopyEnum.DONE });
      setTimeout(() => { this.setState({ copy: CopyEnum.INIT, }) }, 800);
    });
  }
  render() {
    const className = (this.state.copy === CopyEnum.DONE ? 'copied ' : '') + ' copy-icon';
    return (
      <a className={className} href={null} title={this.props.address} onClick={this.handleCopy}>
        {this.state.copy === CopyEnum.IN_PROGRESS && <textarea ref={this.textareaRef} defaultValue={this.props.address}></textarea>}
      </a>
    );
  }
}