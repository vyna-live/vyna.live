// This script is used to load the Phantom Wallet connector
// It should be included in the HTML head
(function() {
  let installed = false;
  let checkCount = 0;
  const maxChecks = 20;
  
  function checkForPhantom() {
    if (window.solana || window.phantom?.solana) {
      console.log('Phantom wallet detected.');
      installed = true;
      
      // Dispatch an event for the app to know Phantom is available
      window.dispatchEvent(new CustomEvent('phantomWalletReady', {
        detail: {
          provider: window.phantom?.solana || window.solana
        }
      }));
      
      return;
    }
    
    checkCount++;
    if (checkCount < maxChecks) {
      // Check every 500ms up to 10 seconds
      setTimeout(checkForPhantom, 500);
    } else {
      console.log('Phantom wallet not detected after multiple attempts.');
      // Dispatch an event for the app to know Phantom is not available
      window.dispatchEvent(new CustomEvent('phantomWalletNotAvailable'));
    }
  }
  
  // Start checking for Phantom wallet
  checkForPhantom();
})();