import { extractHrefs } from './helpers/extract.js';
import { showToast } from './helpers/toast.js';

let lastElement = null;
let isActive = false;
let popup = null;
const showToastLocal = (message, type = 'success') => {
  showToast(document, message, type);
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
  const linkCount = extractHrefs(targetElement).length;
  showLinkCountPopup(event.clientX, event.clientY, linkCount);
};

// クリック時のリンク抽出処理
const onClick = (event) => {
  if (!isActive) return;
  event.preventDefault();
  event.stopPropagation();

  const targetElement = event.target;
  const hrefs = extractHrefs(targetElement);
  const resultText = hrefs.join('\n');

  if (resultText) {
    navigator.clipboard.writeText(resultText).then(() => {
      console.log('Copied links to clipboard:', resultText);
      showToastLocal(`Copied ${hrefs.length} link(s)`, 'success');
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
      showToastLocal(`Copy failed: ${err && err.message ? err.message : err}`, 'error');
    });
  } else {
    console.log('No links were found inside the selected element.');
    showToastLocal('No links found in selection', 'error');
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
  console.log('Inspector activated.');
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
  console.log('Inspector deactivated.');
};

// background.jsからのメッセージを待機
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "activate_inspector") {
    activate();
    sendResponse({ status: "activated" });
  }
  return true; // 非同期の応答のためにチャネルを開いたままにする
});
// end of module
