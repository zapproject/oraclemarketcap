window.ipfsUtils = (function(){
  var ipfsUtils = {};
  var A = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  // Base58 Encoder/Decoder https://gist.github.com/diafygi/90a3e80ca1c2793220e5/
  var to_b58 = function(B,A){var d=[],s="",i,j,c,n;for(i in B){j=0,c=B[i];s+=c||s.length^i?"":1;while(j in d||c){n=d[j];n=n?n*256+c:c;c=n/58|0;d[j]=n%58;j++}}while(j--)s+=A[d[j]];return s};
  var from_b58 = function(S,A){var d=[],b=[],i,j,c,n;for(i in S){j=0,c=A.indexOf(S[i]);if(c<0)return undefined;c||b.length^i?i:b.push(0);while(j in d||c){n=d[j];n=n?n*58+c:c;c=n>>8;d[j]=n%256;j++}}while(j--)b.push(d[j]);return new Uint8Array(b)};
  ipfsUtils.bytesToAddress = function(B) {
    return to_b58([18, 32].concat(B), A);
  };
  ipfsUtils.addressToBytes = function(S) {
    return from_b58(S, A).slice(2);
  }
  return ipfsUtils;
}());
