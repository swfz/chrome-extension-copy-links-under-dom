// このスクリプトがページに一度でも注入されたかを記録するフラグ
if (typeof window.domLinkExtractor_hasBeenInjected === 'undefined') {
  window.domLinkExtractor_hasBeenInjected = true;

  let lastElement = null;
  let isActive = false;
  let popup = null;
  let toastContainer = null;
  const toastLifespanMs = 2600;

  // トースト用DOMの用意
  const ensureToastContainer = () => {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'link-toast-container';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  };

  const showToast = (message, type = 'success') => {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `link-toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // アニメーション開始
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // 一定時間後に消える
    const remove = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
        if (toastContainer && toastContainer.childElementCount === 0) {
          toastContainer.remove();
          toastContainer = null;
        }
      }, 180);
    };

    setTimeout(remove, toastLifespanMs);
  };

  // ポップアップを作成・表示
  const showLinkCountPopup = (x, y, linkCount) => {
    hidePopup();
    popup = document.createElement('div');
    popup.className = 'link-count-popup';
    popup.textContent = `Links: ${linkCount}`;
    popup.style.left = `${x + 10}px`;
    popup.style.top = `${y - 30}px`;
    document.body.appendChild(popup);
  };

  // ポップアップを非表示
  const hidePopup = () => {
    if (popup) {
      popup.remove();
      popup = null;
    }
  };

  // マウスオーバー時のハイライト処理
  const onMouseOver = (event) => {
    if (!isActive) return;
    if (lastElement) {
      lastElement.classList.remove('inspector-highlight');
    }
    const targetElement = event.target;
    targetElement.classList.add('inspector-highlight');
    lastElement = targetElement;

    // リンク数をカウントしてポップアップ表示
    const links = targetElement.querySelectorAll('a');
    const linkCount = Array.from(links).filter(a => a.href).length;
    showLinkCountPopup(event.clientX, event.clientY, linkCount);
  };

  // クリック時のリンク抽出処理
  const onClick = (event) => {
    if (!isActive) return;
    event.preventDefault();
    event.stopPropagation();

    const targetElement = event.target;
    const links = targetElement.querySelectorAll('a');
    const hrefs = Array.from(links).map(a => a.href).filter(href => href);
    const resultText = hrefs.join('\n');

    if (resultText) {
      navigator.clipboard.writeText(resultText).then(() => {
        console.log('以下のリンクをクリップボードにコピーしました:', resultText);
        showToast(`コピーしました（${hrefs.length}件）`, 'success');
      }).catch(err => {
        console.error('クリップボードへのコピーに失敗しました: ', err);
        showToast(`コピーに失敗しました: ${err && err.message ? err.message : err}`, 'error');
      });
    } else {
      console.log('選択された要素内にリンクは見つかりませんでした。');
      showToast('選択範囲にリンクが見つかりません', 'error');
    }
    
    // 処理後に機能を停止
    deactivate();
  };

  // 機能を有効化し、イベントリスナーを登録
  const activate = () => {
    if (isActive) return;
    isActive = true;
    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('click', onClick, true);
    console.log("インスペクターが有効になりました。");
  };

  // 機能を無効化し、イベントリスナーとハイライトを削除
  const deactivate = () => {
    if (!isActive) return;
    isActive = false;
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('click', onClick, true);
    hidePopup();
    if (lastElement) {
      lastElement.classList.remove('inspector-highlight');
      lastElement = null;
    }
    console.log("インスペクターが無効になりました。");
  };

  // background.jsからのメッセージを待機
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "activate_inspector") {
      activate();
      sendResponse({ status: "activated" });
    }
    return true; // 非同期の応答のためにチャネルを開いたままにする
  });
}
