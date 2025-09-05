
chrome.action.onClicked.addListener((tab) => {
  // 拡張機能が動作しない特殊なページでは何もしない
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('https://chrome.google.com/')) {
    console.log("Cannot run on this special page.");
    return;
  }

  // 1. CSSを注入
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["inspector.css"],
  });

  // 2. コンテンツスクリプトを注入
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      files: ["content.js"],
    },
    () => {
      // 3. スクリプトの注入完了後、アクティベートメッセージを送信
      // これで受信側が必ず存在することを保証する
      chrome.tabs.sendMessage(tab.id, { action: "activate_inspector" }, (response) => {
        if (chrome.runtime.lastError) {
          // メッセージ送信でエラーが起きた場合のフォールバック
          console.error(chrome.runtime.lastError.message);
        }
      });
    }
  );
});
