<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  let isMenuOpen = false;
  let showSponsorModal = false;
  let showEntryModal = false;
  let countdownText = '';
  let showFloatingButton = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  function showSponsorModalHandler() {
    showSponsorModal = true;
  }

  function closeSponsorModal() {
    showSponsorModal = false;
  }

  function showFloatingEntryModal() {
    showEntryModal = true;
    // カスタムイベントを発火してメインページの関数を呼び出す
    window.dispatchEvent(new CustomEvent('openEntryModal'));
  }

  function updateCountdown() {
    const deadline = new Date('2025-11-09T06:00:00+09:00'); // 2025年11月9日 朝6時（JST）
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) {
      countdownText = '受付終了';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      countdownText = `締切まであと${days}日`;
    } else if (hours > 0) {
      countdownText = `締切まであと${hours}時間`;
    } else {
      countdownText = `締切まであと${minutes}分`;
    }
  }

  onMount(() => {
    // Initialize countdown
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 60000); // Update every minute


    // スクロール監視でフローティングボタンの表示制御
    function handleScroll() {
      const featuresSection = document.querySelector('.featuresGrid');
      if (featuresSection && featuresSection instanceof HTMLElement) {
        const featureTop = featuresSection.offsetTop;
        const scrollY = window.scrollY || window.pageYOffset;
        const headerHeight = 120; // ヘッダー高さを考慮

        // featuresセクション上部より下にスクロールしたら表示
        showFloatingButton = scrollY >= (featureTop - headerHeight);
      }
    }

    // スクロールイベントにスロットリング追加
    let ticking = false;
    function scrollHandler() {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }

    // スクロールイベントリスナー追加
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // 初期チェック
    setTimeout(handleScroll, 100);

    return () => {
      clearInterval(countdownInterval);
      window.removeEventListener('scroll', scrollHandler);
    };
  });
</script>

  <header class="siteHeader">
    <nav class="siteHeader__container">
      <div class="siteHeader__content">
      <a href="/" class="siteLogo">
        <h1><img src="/images/logo.webp" alt="始祖会/SHISOKAI" class="siteLogo__image" /></h1>
      </a>
      <button class="menuToggle" class:menuToggle--open={isMenuOpen} on:click={toggleMenu} aria-label="メニューを開く">
        <span class="menuToggle__line"></span>
        <span class="menuToggle__line"></span>
        <span class="menuToggle__line"></span>
      </button>
      <ul class="navMenu" class:navMenu--open={isMenuOpen}>
        <li class="navMenu__item"><a href="/" class="navMenu__link" class:navMenu__link--active={$page.url.pathname === '/'} on:click={closeMenu}>
          <span class="navMenu__icon material-icons">home</span>
          <span class="navMenu__text">ホーム</span>
        </a></li>
        <li class="navMenu__item"><a href="/about" class="navMenu__link" class:navMenu__link--active={$page.url.pathname === '/about'} on:click={closeMenu}>
          <span class="navMenu__icon material-icons">person</span>
          <span class="navMenu__text">主宰について</span>
        </a></li>
        <li class="navMenu__item"><a href="/contact" class="navMenu__link" class:navMenu__link--active={$page.url.pathname === '/contact'} on:click={closeMenu}>
          <span class="navMenu__icon material-icons">mail</span>
          <span class="navMenu__text">お問い合わせ</span>
        </a></li>
      </ul>
    </div>
  </nav>
</header>

<main>
  <slot />
</main>

<!-- フローティング参加表明ボタンとカウントダウン（ホームページでfeatures以降に表示） -->
{#if false}
{#if $page.url.pathname === '/' && showFloatingButton}
<div class="floatingContainer" transition:fly="{{ y: 50, duration: 400 }}">
  <!-- カウントダウン吹き出し -->
  {#if countdownText}
  <div class="floatingCountdown">
    <span class="material-icons">schedule</span>
    {countdownText}
  </div>
  {/if}

  <!-- 参加ボタン -->
  <button
    class="floatingEntryButton"
    on:click={showFloatingEntryModal}
    aria-label="参加する"
    title="参加フォームを開く"
  >
    <span class="material-icons">event_available</span>
    <span class="floatingButtonText">参加する</span>
  </button>
</div>
{/if}
{/if}

<section class="sponsorSection">
  <div class="sponsorSection__container">
    <div class="sponsorSection__banners">
      <a href="https://x.com/Ours_moto" target="_blank" rel="noopener noreferrer">
        <img src="/images/banner-ours.webp" alt="Ours moto cafe" class="sponsorSection__banner" />
      </a>
      <a href="http://cafedoor.jp/" target="_blank" rel="noopener noreferrer">
        <img src="/images/banner-door.webp" alt="cafe door" class="sponsorSection__banner" />
      </a>
      <a href="http://www.coregarage-japan.com/" target="_blank" rel="noopener noreferrer">
        <img src="/images/banner-coregarage.webp" alt="Core Garage" class="sponsorSection__banner" />
      </a>
    </div>
  </div>
  <div class="sponsorInfo">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <span class="material-icons helpIcon" on:click={showSponsorModalHandler}>help_center</span>
  </div>
</section>

{#if showSponsorModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modalOverlay" on:click={closeSponsorModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="modalContent" on:click|stopPropagation>
      <div class="modalHeader">
        <h3>掲載バナー募集のお知らせ</h3>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <span class="material-icons closeIcon" on:click={closeSponsorModal}>close</span>
      </div>
      <div class="modalBody">
        <p>始祖会 Kanto Owners Meeting では、掲載バナーを募集しています。</p>
        <p>バイク関連ショップ、パーツメーカー、その他関連企業様のバナー掲載をお待ちしております。</p>
        <p>お手数ですが<a href="/contact">お問い合わせ</a>よりご連絡お願いいたします。</p>
      </div>
    </div>
  </div>
{/if}

<footer class="siteFooter">
  <div class="siteFooter__container">
    <div class="shareSection">
      <div class="shareButtons">
        <!-- X (Twitter) -->
        <a
          href="https://twitter.com/intent/tweet?text={encodeURIComponent('始祖会 Kanto Owners Meeting 2025 Side-B\nGPZ1000RX & ZX-10オーナーズミーティング\n2025年11月9日(日) 9:00-11:00\n')}&url={encodeURIComponent('https://kanto.shisokai.info')}&hashtags={encodeURIComponent('始祖会,GPZ1000RX,ZX10,バイク')}"
          target="_blank"
          rel="noopener noreferrer"
          class="shareButton shareX"
          aria-label="Xでシェア"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#000">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>

        <!-- Instagram -->
        <button
          on:click={() => {
            navigator.share ? 
              navigator.share({
                title: '始祖会 Kanto Owners Meeting 2025 Side-B',
                text: 'GPZ1000RX & ZX-10オーナーズミーティング',
                url: 'https://kanto.shisokai.info'
              }) :
              alert('Instagramストーリーズでシェアするには、スマートフォンからアクセスしてスクリーンショットを撮影してください。');
          }}
          class="shareButton shareInstagram"
          aria-label="Instagramでシェア"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
          </svg>
        </button>

        <!-- Facebook -->
        <a
          href="https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent('https://kanto.shisokai.info')}"
          target="_blank"
          rel="noopener noreferrer"
          class="shareButton shareFacebook"
          aria-label="Facebookでシェア"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>

        <!-- LINE -->
        <a
          href="https://social-plugins.line.me/lineit/share?url={encodeURIComponent('https://kanto.shisokai.info')}"
          target="_blank"
          rel="noopener noreferrer"
          class="shareButton shareLine"
          aria-label="LINEでシェア"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.630.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.135.33.088.849.042 1.255l-.18 1.103c-.054.32-.243 1.244 1.095.678 1.337-.567 7.22-4.25 9.849-7.284v-.002c1.815-2.033 2.222-4.338 2.222-4.338-.002-.409-.002-.822-.121-1.186z"/>
          </svg>
        </a>
      </div>
    </div>

    <div class="footerBottom">
      <p class="siteFooter__copyright">&copy; 2023-{new Date().getFullYear()} SHISOKAI KANTO All rights reserved.</p>
    </div>
  </div>
</footer>

<style>
  :global(html) {
    overflow-x: hidden;
  }

  :global(body) {
    overflow-x: hidden;
    position: relative;
  }

  .siteHeader {
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 2px solid #333;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .siteHeader__container {
    max-width: none;
    margin: 0;
    padding: 0 20px;
  }

  .siteHeader__content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    width: 100%;
  }

  .siteLogo {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    text-decoration: none;
  }

  .siteLogo:hover {
    opacity: 0.8;
  }

  .siteLogo h1 {
    margin: 0;
    font-size: inherit;
  }

  .siteLogo__image {
    height: 40px;
    width: auto;
    object-fit: contain;
    display: block;
  }



  .menuToggle {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    width: 30px;
    height: 30px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 10;
    flex-shrink: 0;
  }

  .menuToggle__line {
    width: 100%;
    height: 3px;
    background-color: #333;
    transition: all 0.3s ease;
    transform-origin: center;
  }

  .menuToggle--open .menuToggle__line:nth-child(1) {
    transform: translateY(10px) rotate(45deg);
  }

  .menuToggle--open .menuToggle__line:nth-child(2) {
    opacity: 0;
  }

  .menuToggle--open .menuToggle__line:nth-child(3) {
    transform: translateY(-10px) rotate(-45deg);
  }

  .navMenu {
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    height: 100vh;
    background-color: #fff;
    list-style: none;
    margin: 0;
    padding: 80px 20px 20px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 5;
    display: flex;
    flex-direction: column;
  }

  .navMenu--open {
    transform: translateX(0);
  }

  .navMenu__item {
    margin: 0;
  }

  .navMenu__link {
    display: flex;
    align-items: center;
    gap: 15px;
    font-weight: 500;
    font-size: 1.2rem;
    padding: 15px 0;
    border-bottom: 1px solid #333;
    color: #333;
    text-decoration: none !important;
  }

  .navMenu__link:hover {
    color: #333;
    text-decoration: none !important;
  }

  .navMenu__icon {
    font-size: 1.5rem;
  }

  .navMenu__link--active {
    font-weight: bold;
  }

  main {
    min-height: calc(100vh - 200px);
  }

  .sponsorSection {
    background-color: #f5f5f5;
    padding: 30px 0;
    border-top: 2px solid #ccc;
    position: relative;
  }

  .sponsorSection__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    text-align: center;
  }

  .sponsorSection__banners {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
  }

  .sponsorSection__banner {
    width: 300px;
    height: 100px;
    object-fit: cover;
    border: 2px solid #ccc;
    border-radius: 5px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .sponsorSection__banner:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .sponsorInfo {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .helpIcon {
    cursor: pointer;
    font-size: 1.2rem;
    color: #666;
    transition: opacity 0.3s ease;
  }

  .helpIcon:hover {
    opacity: 0.8;
  }

  .modalOverlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modalContent {
    background-color: #fff;
    border-radius: 5px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modalHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
  }

  .modalHeader h3 {
    margin: 0;
    color: #333;
    font-size: 1.3rem;
  }

  .closeIcon {
    cursor: pointer;
    color: #666;
    transition: color 0.3s ease;
    font-size: 1.5rem;
  }

  .closeIcon:hover {
    color: #333;
  }

  .modalBody {
    padding: 20px;
    color: #333;
    line-height: 1.6;
  }

  .modalBody p {
    margin-bottom: 15px;
  }

  .modalBody p:last-child {
    margin-bottom: 0;
  }

  .siteFooter {
    background-color: #2c2c2c;
    color: #fff;
    padding: 30px 0 15px;
  }

  .shareSection {
    text-align: center;
    margin-bottom: 20px;
  }

  .shareButtons {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .shareButton {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 16px;
  }

  .shareX {
    background-color: #fff;
    color: #000;
    border: 1px solid #ddd;
  }

  .shareX:hover {
    background-color: #f5f5f5;
    transform: translateY(-3px);
  }

  .shareInstagram {
    background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);
    color: #fff;
  }

  .shareInstagram:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(240, 148, 51, 0.4);
  }

  .shareFacebook {
    background-color: #1877f2;
    color: #fff;
  }

  .shareFacebook:hover {
    background-color: #166fe5;
    transform: translateY(-3px);
  }

  .shareLine {
    background-color: #00b900;
    color: #fff;
  }

  .shareLine:hover {
    background-color: #009900;
    transform: translateY(-3px);
  }

  .shareButton svg {
    width: 16px;
    height: 16px;
  }

  .footerBottom {
    border-top: 1px solid #444;
    padding-top: 15px;
    text-align: right;
    padding-right: 20px;
  }

  .siteFooter__copyright {
    margin: 0;
    font-size: 0.75rem;
    color: #ccc;
  }

  @media (min-width: 768px) {
    .navMenu {
      width: 400px;
      padding: 100px 40px 40px;
    }

    .navMenu__link {
      font-size: 1.1rem;
      padding: 20px 0;
    }
  }


  @media (max-width: 768px) {
    .siteFooter {
      padding: 20px 0 10px;
    }

    .shareButtons {
      gap: 15px;
    }

    .shareButton {
      width: 28px;
      height: 28px;
    }

    .shareButton svg {
      width: 14px;
      height: 14px;
    }

    .footerBottom {
      flex-direction: column;
      text-align: center;
      gap: 15px;
    }

  }

  /* リンクの色 */
  a {
    color: #1e90ff;
    text-decoration: none;
  }

  a:hover {
    color: #4169e1;
    text-decoration: underline;
  }

  /* フローティングコンテナ */
  .floatingContainer {
    position: fixed;
    bottom: 20px;
    left: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    z-index: 999;
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  /* カウントダウン吹き出し */
  .floatingCountdown {
    background: linear-gradient(135deg, #fff 0%, #f8f8f8 100%);
    color: #333;
    border: 2px solid #b81c25;
    border-radius: 20px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    position: relative;
    white-space: nowrap;
    animation: gentle-pulse 2s ease-in-out infinite;
  }

  /* 吹き出しの矢印 */
  .floatingCountdown::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 20px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #b81c25;
  }

  .floatingCountdown::before {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 22px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #fff;
    z-index: 1;
  }

  @keyframes gentle-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .floatingCountdown .material-icons {
    font-size: 1rem;
    color: #b81c25;
  }

  /* フローティング参加表明ボタン */
  .floatingEntryButton {
    background: linear-gradient(135deg, #b81c25 0%, #c00000 100%);
    color: #fff;
    border: none;
    border-radius: 50px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(235, 16, 0, 0.3);
    transition: all 0.3s ease;
    font-family: inherit;
    min-width: 120px;
    justify-content: center;
  }

  .floatingEntryButton:hover {
    background: linear-gradient(135deg, #c00000 0%, #a00000 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(235, 16, 0, 0.4);
  }

  .floatingEntryButton:active {
    transform: translateY(0);
    box-shadow: 0 2px 15px rgba(235, 16, 0, 0.3);
  }

  .floatingEntryButton .material-icons {
    font-size: 1.2rem;
  }

  .floatingButtonText {
    font-size: 0.9rem;
    letter-spacing: 0.5px;
  }

  @media (max-width: 767px) {
    .floatingContainer {
      bottom: 15px;
      left: 15px;
    }

    .floatingCountdown {
      font-size: 0.8rem;
      padding: 6px 12px;
      border-radius: 15px;
    }

    .floatingCountdown::after {
      left: 16px;
      border-left-width: 6px;
      border-right-width: 6px;
      border-top-width: 6px;
    }

    .floatingCountdown::before {
      left: 18px;
      border-left-width: 4px;
      border-right-width: 4px;
      border-top-width: 4px;
    }

    .floatingCountdown .material-icons {
      font-size: 0.9rem;
    }

    .floatingEntryButton {
      padding: 10px 16px;
      font-size: 0.85rem;
      min-width: 100px;
    }

    .floatingEntryButton .material-icons {
      font-size: 1.1rem;
    }

    .floatingButtonText {
      font-size: 0.8rem;
    }
  }
</style> 
